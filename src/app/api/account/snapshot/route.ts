import { getDb } from '@/lib/server/db';
import { applyLearningClaims, getBalance, mergeAuthoritativeProgress } from '@/lib/server/progression';
import { isSameOriginRequest, jsonError } from '@/lib/server/request';
import { getCurrentUser } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const MAX_SNAPSHOT_BYTES = 2_000_000;

interface SnapshotRow extends Record<string, unknown> {
  data: string;
  updatedAt: string;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('로그인이 필요합니다.', 401);

    const connection = await getDb().getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.execute<SnapshotRow[]>(
        'SELECT data, updated_at AS updatedAt FROM user_snapshots WHERE user_id = ? LIMIT 1',
        [user.id],
      );
      const row = rows[0];
      const balance = await getBalance(connection, user.id);
      await connection.commit();
      if (!row) return Response.json({ snapshot: null, updatedAt: null });
      const snapshot = mergeAuthoritativeProgress(JSON.parse(row.data) as Record<string, unknown>, balance);
      return Response.json({ snapshot, updatedAt: row.updatedAt });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Snapshot lookup failed', error);
    if (error instanceof Error && error.message === 'DATABASE_NOT_CONFIGURED') {
      return jsonError('SQLite 연결 설정이 필요합니다.', 503);
    }
    return jsonError('학습 기록을 불러오지 못했습니다.', 500);
  }
}

export async function PUT(request: Request) {
  if (!isSameOriginRequest(request)) return jsonError('허용되지 않은 요청입니다.', 403);

  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('로그인이 필요합니다.', 401);

    const body = (await request.json()) as { snapshot?: unknown };
    if (!body.snapshot || typeof body.snapshot !== 'object' || Array.isArray(body.snapshot)) {
      return jsonError('저장할 학습 기록이 올바르지 않습니다.', 400);
    }
    const submittedSnapshot = body.snapshot as Record<string, unknown>;
    if (Buffer.byteLength(JSON.stringify(submittedSnapshot), 'utf8') > MAX_SNAPSHOT_BYTES) {
      return jsonError('학습 기록의 크기가 너무 큽니다.', 413);
    }

    const connection = await getDb().getConnection();
    try {
      await connection.beginTransaction();
      const balance = await applyLearningClaims(connection, user.id, submittedSnapshot.learningEvents);
      const snapshot = mergeAuthoritativeProgress(submittedSnapshot, balance);
      const serialized = JSON.stringify(snapshot);
      await connection.execute(
        `INSERT INTO user_snapshots (user_id, data, updated_at)
         VALUES (?, json(?), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
         ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
        [user.id, serialized],
      );
      await connection.commit();
      return Response.json({ saved: true, stats: snapshot.stats, updatedAt: new Date().toISOString() });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Snapshot save failed', error);
    if (error instanceof Error && error.message === 'DATABASE_NOT_CONFIGURED') {
      return jsonError('SQLite 연결 설정이 필요합니다.', 503);
    }
    return jsonError('학습 기록을 저장하지 못했습니다.', 500);
  }
}
