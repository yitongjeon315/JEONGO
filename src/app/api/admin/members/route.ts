import { randomUUID } from 'node:crypto';
import { getDb } from '@/lib/server/db';
import { isSameOriginRequest, jsonError } from '@/lib/server/request';
import { getCurrentUser } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

interface MemberSummaryRow extends Record<string, unknown> {
  total: number;
  admins: number;
  learners: number;
  activeSessions: number;
  joinedLast7Days: number;
}

interface MemberRow extends Record<string, unknown> {
  id: string;
  email: string;
  name: string;
  role: 'learner' | 'admin';
  createdAt: string;
  googleLinked: number;
  gold: number;
  xp: number;
  level: number;
  activeSessions: number;
  lastSnapshotAt: string | null;
}

interface CountRow extends Record<string, unknown> { total: number }
interface RoleRow extends Record<string, unknown> {
  id: string;
  email: string;
  name: string;
  role: 'learner' | 'admin';
}

function noStoreJson(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set('Cache-Control', 'private, no-store, max-age=0');
  headers.set('X-Content-Type-Options', 'nosniff');
  return Response.json(body, { ...init, headers });
}

export async function GET(request: Request) {
  try {
    const admin = await getCurrentUser();
    if (!admin) return jsonError('로그인이 필요합니다.', 401);
    if (admin.role !== 'admin') return jsonError('관리자 권한이 필요합니다.', 403);

    const url = new URL(request.url);
    const search = (url.searchParams.get('q') ?? '').trim().slice(0, 80);
    const requestedPage = Number(url.searchParams.get('page') ?? '1');
    const page = Number.isSafeInteger(requestedPage) ? Math.min(10_000, Math.max(1, requestedPage)) : 1;
    const pattern = `%${search}%`;
    const offset = (page - 1) * PAGE_SIZE;
    const db = getDb();

    const [summaryRows] = await db.execute<MemberSummaryRow[]>(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admins,
              SUM(CASE WHEN role = 'learner' THEN 1 ELSE 0 END) AS learners,
              (SELECT COUNT(*) FROM sessions WHERE expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) AS activeSessions,
              SUM(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) AS joinedLast7Days
         FROM users`,
    );
    const [countRows] = await db.execute<CountRow[]>(
      'SELECT COUNT(*) AS total FROM users WHERE (? = ? OR email LIKE ? OR name LIKE ?)',
      [search, '', pattern, pattern],
    );
    const [members] = await db.execute<MemberRow[]>(
      `SELECT u.id, u.email, u.name, u.role, u.created_at AS createdAt,
              CASE WHEN EXISTS(SELECT 1 FROM oauth_accounts o WHERE o.user_id = u.id AND o.provider = 'google') THEN 1 ELSE 0 END AS googleLinked,
              COALESCE(b.gold, 0) AS gold, COALESCE(b.xp, 0) AS xp, COALESCE(b.level, 1) AS level,
              (SELECT COUNT(*) FROM sessions s WHERE s.user_id = u.id AND s.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) AS activeSessions,
              snap.updated_at AS lastSnapshotAt
         FROM users u
         LEFT JOIN account_balances b ON b.user_id = u.id
         LEFT JOIN user_snapshots snap ON snap.user_id = u.id
        WHERE (? = ? OR u.email LIKE ? OR u.name LIKE ?)
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?`,
      [search, '', pattern, pattern, PAGE_SIZE, offset],
    );

    const summary = summaryRows[0] ?? { total: 0, admins: 0, learners: 0, activeSessions: 0, joinedLast7Days: 0 };
    return noStoreJson({
      summary,
      members: members.map((member) => ({ ...member, googleLinked: Boolean(member.googleLinked) })),
      pagination: { page, pageSize: PAGE_SIZE, total: countRows[0]?.total ?? 0 },
      currentUserId: admin.id,
    });
  } catch (error) {
    console.error('Admin member lookup failed', error);
    return jsonError('회원 정보를 불러오지 못했습니다.', 500);
  }
}

export async function PATCH(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin || !isSameOriginRequest(request)) return jsonError('허용되지 않은 요청입니다.', 403);

  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'admin') return jsonError('관리자 권한이 필요합니다.', 403);

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const targetUserId = typeof body?.userId === 'string' ? body.userId.trim().slice(0, 100) : '';
    const action = body?.action;
    if (!targetUserId || (action !== 'set_role' && action !== 'revoke_sessions')) {
      return jsonError('회원 또는 관리 작업이 올바르지 않습니다.', 400);
    }
    if (targetUserId === admin.id) return jsonError('현재 관리자 자신의 권한이나 세션은 변경할 수 없습니다.', 400);

    const db = getDb();
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [targetRows] = await connection.execute<RoleRow[]>(
        'SELECT id, email, name, role FROM users WHERE id = ? LIMIT 1',
        [targetUserId],
      );
      const target = targetRows[0];
      if (!target) throw new Error('MEMBER_NOT_FOUND');

      if (action === 'set_role') {
        const role = body?.role;
        if (role !== 'learner' && role !== 'admin') throw new Error('INVALID_ROLE');
        if (target.role !== role) {
          if (target.role === 'admin' && role === 'learner') {
            const [adminRows] = await connection.execute<CountRow[]>("SELECT COUNT(*) AS total FROM users WHERE role = 'admin'");
            if ((adminRows[0]?.total ?? 0) <= 1) throw new Error('LAST_ADMIN');
          }
          await connection.execute(
            "UPDATE users SET role = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?",
            [role, target.id],
          );
          await connection.execute('DELETE FROM sessions WHERE user_id = ?', [target.id]);
          await connection.execute(
            'INSERT INTO admin_audit_logs (id, admin_user_id, target_user_id, action, details) VALUES (?, ?, ?, ?, json(?))',
            [randomUUID(), admin.id, target.id, 'member_role_changed', JSON.stringify({ previousRole: target.role, role })],
          );
        }
        await connection.commit();
        return noStoreJson({ updated: true, role });
      }

      const [, revokeResult] = await connection.execute('DELETE FROM sessions WHERE user_id = ?', [target.id]);
      const revokedSessions = revokeResult?.affectedRows ?? 0;
      await connection.execute(
        'INSERT INTO admin_audit_logs (id, admin_user_id, target_user_id, action, details) VALUES (?, ?, ?, ?, json(?))',
        [randomUUID(), admin.id, target.id, 'member_sessions_revoked', JSON.stringify({ revokedSessions })],
      );
      await connection.commit();
      return noStoreJson({ revoked: true, sessions: revokedSessions });
    } catch (error) {
      await connection.rollback();
      if (error instanceof Error && error.message === 'MEMBER_NOT_FOUND') return jsonError('회원을 찾을 수 없습니다.', 404);
      if (error instanceof Error && error.message === 'INVALID_ROLE') return jsonError('회원 권한이 올바르지 않습니다.', 400);
      if (error instanceof Error && error.message === 'LAST_ADMIN') return jsonError('마지막 관리자는 학습자로 변경할 수 없습니다.', 409);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Admin member update failed', error);
    return jsonError('회원 정보를 변경하지 못했습니다.', 500);
  }
}
