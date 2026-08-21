import { getDb } from './db';
import { jsonError } from './request';
import { getCurrentUser } from './session';

type AiScope = 'tutor' | 'translate' | 'transcribe';

interface CountRow extends Record<string, unknown> {
  count: number;
  oldestAt: string | null;
}

const WINDOW_SECONDS = 10 * 60;
const LIMITS: Record<AiScope, number> = {
  tutor: 30,
  translate: 60,
  transcribe: 15,
};

export async function enforceAiAccess(scope: AiScope): Promise<Response | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('로그인이 필요합니다.', 401);

    const now = new Date();
    const cutoff = new Date(now.getTime() - WINDOW_SECONDS * 1000).toISOString();
    const cleanupCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const connection = await getDb().getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute('DELETE FROM ai_rate_limit_events WHERE created_at < ?', [cleanupCutoff]);
      const [rows] = await connection.execute<CountRow[]>(
        `SELECT COUNT(*) AS count, MIN(created_at) AS oldestAt
           FROM ai_rate_limit_events
          WHERE user_id = ? AND scope = ? AND created_at >= ?`,
        [user.id, scope, cutoff],
      );
      const count = Number(rows[0]?.count ?? 0);
      if (count >= LIMITS[scope]) {
        await connection.rollback();
        const oldestTime = rows[0]?.oldestAt ? Date.parse(rows[0].oldestAt) : now.getTime();
        const retryAfter = Math.max(1, Math.ceil((oldestTime + WINDOW_SECONDS * 1000 - now.getTime()) / 1000));
        return Response.json(
          { error: 'AI 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
          { status: 429, headers: { 'Retry-After': String(retryAfter) } },
        );
      }
      await connection.execute(
        'INSERT INTO ai_rate_limit_events (user_id, scope, created_at) VALUES (?, ?, ?)',
        [user.id, scope, now.toISOString()],
      );
      await connection.commit();
      return null;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('AI access check failed', error);
    return jsonError('AI 요청 권한을 확인하지 못했습니다.', 503);
  }
}
