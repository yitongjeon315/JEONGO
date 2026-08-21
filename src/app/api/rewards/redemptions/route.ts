import { randomUUID } from 'node:crypto';
import { getDb } from '@/lib/server/db';
import { isSameOriginRequest, jsonError } from '@/lib/server/request';
import { getCurrentUser } from '@/lib/server/session';
import { encryptPhone, maskPhone, normalizeKoreanPhone, type RewardRedemptionSummary, type RedemptionStatus } from '@/lib/reward-redemption';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RedemptionRow extends Record<string, unknown> {
  id: string;
  rewardId: string;
  rewardName: string;
  cost: number;
  phoneLast4: string;
  status: RedemptionStatus;
  createdAt: string;
}

interface RewardRow extends Record<string, unknown> { id: string; name: string; cost: number }
interface BalanceRow extends Record<string, unknown> { gold: number }
interface RedemptionMutationRow extends Record<string, unknown> { id: string; userId: string; cost: number; status: RedemptionStatus }

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('로그인이 필요합니다.', 401);
    const adminScope = new URL(request.url).searchParams.get('scope') === 'all';
    if (adminScope && user.role !== 'admin') return jsonError('관리자 권한이 필요합니다.', 403);
    const [rows] = await getDb().execute<RedemptionRow[]>(
      `SELECT id, reward_id AS rewardId, reward_name AS rewardName, cost,
              phone_last4 AS phoneLast4, status, created_at AS createdAt
         FROM reward_redemptions ${adminScope ? '' : 'WHERE user_id = ?'} ORDER BY created_at DESC LIMIT 100`,
      adminScope ? [] : [user.id],
    );
    const redemptions: RewardRedemptionSummary[] = rows.map((row) => ({
      id: row.id,
      rewardId: row.rewardId,
      rewardName: row.rewardName,
      cost: row.cost,
      phoneMasked: `010-****-${row.phoneLast4}`,
      status: row.status,
      createdAt: new Date(row.createdAt).toISOString(),
    }));
    return Response.json({ redemptions });
  } catch (error) {
    console.error('Redemption lookup failed', error);
    return jsonError(error instanceof Error && error.message === 'DATABASE_NOT_CONFIGURED' ? 'SQLite 연결 설정이 필요합니다.' : '환전 신청 내역을 불러오지 못했습니다.', error instanceof Error && error.message === 'DATABASE_NOT_CONFIGURED' ? 503 : 500);
  }
}

export async function PATCH(request: Request) {
  if (!isSameOriginRequest(request)) return jsonError('허용되지 않은 요청입니다.', 403);
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return jsonError('관리자 권한이 필요합니다.', 403);
    const body = (await request.json()) as Record<string, unknown>;
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const status = typeof body.status === 'string' ? body.status : '';
    if (!id || !(['approved', 'sent', 'cancelled'] as const).includes(status as 'approved' | 'sent' | 'cancelled')) {
      return jsonError('신청 번호 또는 상태가 올바르지 않습니다.', 400);
    }
    const connection = await getDb().getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.execute<RedemptionMutationRow[]>('SELECT id, user_id AS userId, cost, status FROM reward_redemptions WHERE id = ?', [id]);
      const redemption = rows[0];
      const allowed = redemption && ((redemption.status === 'pending' && (status === 'approved' || status === 'cancelled')) || (redemption.status === 'approved' && (status === 'sent' || status === 'cancelled')));
      if (!allowed) { await connection.rollback(); return jsonError('신청을 찾을 수 없거나 허용되지 않은 상태 변경입니다.', 409); }
      if (status === 'cancelled') {
        const [balances] = await connection.execute<BalanceRow[]>('SELECT gold FROM account_balances WHERE user_id = ?', [redemption.userId]);
        if (!balances[0]) { await connection.rollback(); return jsonError('환불할 사용자 잔액을 찾을 수 없습니다.', 409); }
        const refundedGold = Number(balances[0].gold) + redemption.cost;
        await connection.execute(
          `UPDATE account_balances SET gold = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE user_id = ?`,
          [refundedGold, redemption.userId],
        );
        await connection.execute(
          `INSERT INTO gold_transactions (id, user_id, amount, balance_after, reason, reference_key)
           VALUES (?, ?, ?, ?, 'redemption_refund', ?)`,
          [randomUUID(), redemption.userId, redemption.cost, refundedGold, `redemption-refund:${id}`],
        );
      }
      await connection.execute(
        `UPDATE reward_redemptions SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`,
        [status, id],
      );
      await connection.commit();
      return Response.json({ updated: true, id, status, refunded: status === 'cancelled' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally { connection.release(); }
  } catch (error) {
    console.error('Redemption status update failed', error);
    return jsonError(error instanceof Error && error.message === 'DATABASE_NOT_CONFIGURED' ? 'SQLite 연결 설정이 필요합니다.' : '환전 상태를 변경하지 못했습니다.', error instanceof Error && error.message === 'DATABASE_NOT_CONFIGURED' ? 503 : 500);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return jsonError('허용되지 않은 요청입니다.', 403);
  const encryptionKey = process.env.REDEMPTION_ENCRYPTION_KEY;
  if (!encryptionKey || encryptionKey.length < 24) return jsonError('환전 개인정보 암호화 설정이 필요합니다.', 503);

  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('로그인이 필요합니다.', 401);
    const body = (await request.json()) as Record<string, unknown>;
    const rewardId = typeof body.rewardId === 'string' ? body.rewardId.trim().slice(0, 100) : '';
    const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey.trim().slice(0, 100) : '';
    const phone = normalizeKoreanPhone(body.phoneNumber);
    if (!rewardId || !phone || !idempotencyKey) return jsonError('환전 상품, 전화번호 또는 요청 키가 올바르지 않습니다.', 400);

    const connection = await getDb().getConnection();
    try {
      await connection.beginTransaction();
      const [existing] = await connection.execute<RedemptionRow[]>(
        `SELECT id, reward_id AS rewardId, reward_name AS rewardName, cost,
                phone_last4 AS phoneLast4, status, created_at AS createdAt
           FROM reward_redemptions WHERE user_id = ? AND idempotency_key = ? LIMIT 1`,
        [user.id, idempotencyKey],
      );
      if (existing[0]) {
        await connection.commit();
        return Response.json({ created: false, redemptionId: existing[0].id });
      }

      const [rewards] = await connection.execute<RewardRow[]>(
        'SELECT id, name, cost FROM content_rewards WHERE id = ? LIMIT 1', [rewardId],
      );
      const reward = rewards[0];
      if (!reward) {
        await connection.rollback();
        return jsonError('환전 상품을 찾을 수 없습니다.', 404);
      }
      const [balances] = await connection.execute<BalanceRow[]>('SELECT gold FROM account_balances WHERE user_id = ?', [user.id]);
      const gold = Number(balances[0]?.gold ?? 0);
      if (!balances[0] || !Number.isFinite(gold) || gold < reward.cost) {
        await connection.rollback();
        return jsonError('골드가 부족합니다.', 409);
      }
      const redemptionId = randomUUID();
      const remainingGold = gold - reward.cost;
      await connection.execute(
        `UPDATE account_balances SET gold = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE user_id = ?`,
        [remainingGold, user.id],
      );
      await connection.execute(
        `INSERT INTO reward_redemptions
          (id, user_id, reward_id, reward_name, cost, phone_encrypted, phone_last4, idempotency_key)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [redemptionId, user.id, reward.id, reward.name, reward.cost, encryptPhone(phone, encryptionKey), phone.slice(-4), idempotencyKey],
      );
      await connection.execute(
        `INSERT INTO gold_transactions (id, user_id, amount, balance_after, reason, reference_key)
         VALUES (?, ?, ?, ?, 'redemption', ?)`,
        [randomUUID(), user.id, -reward.cost, remainingGold, `redemption:${redemptionId}`],
      );
      await connection.commit();
      return Response.json({ created: true, redemptionId, remainingGold, phoneMasked: maskPhone(phone) }, { status: 201 });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Redemption creation failed', error);
    return jsonError(error instanceof Error && error.message === 'DATABASE_NOT_CONFIGURED' ? 'SQLite 연결 설정이 필요합니다.' : '환전 신청을 저장하지 못했습니다.', error instanceof Error && error.message === 'DATABASE_NOT_CONFIGURED' ? 503 : 500);
  }
}
