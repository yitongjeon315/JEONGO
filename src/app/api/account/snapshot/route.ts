import type { RowDataPacket } from 'mysql2';
import { getDb } from '@/lib/server/db';
import { isSameOriginRequest, jsonError } from '@/lib/server/request';
import { getCurrentUser } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const MAX_SNAPSHOT_BYTES = 2_000_000;

interface SnapshotRow extends RowDataPacket {
  data: string | Record<string, unknown>;
  updatedAt: Date;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('로그인이 필요합니다.', 401);

    const [rows] = await getDb().execute<SnapshotRow[]>(
      'SELECT data, updated_at AS updatedAt FROM user_snapshots WHERE user_id = ? LIMIT 1',
      [user.id],
    );
    const row = rows[0];
    if (!row) return Response.json({ snapshot: null, updatedAt: null });
    const snapshot = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    return Response.json({ snapshot, updatedAt: row.updatedAt });
  } catch (error) {
    console.error('Snapshot lookup failed', error);
    if (error instanceof Error && error.message === 'DATABASE_NOT_CONFIGURED') {
      return jsonError('MySQL 연결 설정이 필요합니다.', 503);
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
    const serialized = JSON.stringify(body.snapshot);
    if (Buffer.byteLength(serialized, 'utf8') > MAX_SNAPSHOT_BYTES) {
      return jsonError('학습 기록의 크기가 너무 큽니다.', 413);
    }

    await getDb().execute(
      `INSERT INTO user_snapshots (user_id, data)
       VALUES (?, CAST(? AS JSON))
       ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = UTC_TIMESTAMP()`,
      [user.id, serialized],
    );
    return Response.json({ saved: true, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Snapshot save failed', error);
    if (error instanceof Error && error.message === 'DATABASE_NOT_CONFIGURED') {
      return jsonError('MySQL 연결 설정이 필요합니다.', 503);
    }
    return jsonError('학습 기록을 저장하지 못했습니다.', 500);
  }
}
