import { randomUUID } from 'node:crypto';
import type { DatabaseConnection } from './db';

export interface AccountBalanceRow extends Record<string, unknown> {
  gold: number;
  xp: number;
  level: number;
  xpNeeded: number;
}

interface LearningClaim {
  id: string;
  type: 'lesson' | 'pronunciation' | 'reward';
  occurredAt: string;
  gold: number;
  xp: number;
}

const DAILY_REWARDS = new Map([
  ['daily-questions', { gold: 100, xp: 30 }],
  ['daily-dungeon', { gold: 150, xp: 50 }],
  ['daily-pronunciation', { gold: 200, xp: 50 }],
]);

function boundedInteger(value: unknown, minimum: number, maximum: number) {
  return Number.isInteger(value) && Number(value) >= minimum && Number(value) <= maximum ? Number(value) : null;
}

function normalizeClaim(value: unknown): LearningClaim | null {
  if (!value || typeof value !== 'object') return null;
  const event = value as Record<string, unknown>;
  const id = typeof event.id === 'string' ? event.id.trim().slice(0, 100) : '';
  const type = event.type;
  const occurredAt = typeof event.occurredAt === 'string' ? event.occurredAt : '';
  const occurredTime = Date.parse(occurredAt);
  const now = Date.now();
  if (!id || (type !== 'lesson' && type !== 'pronunciation' && type !== 'reward') || !Number.isFinite(occurredTime)) return null;
  if (occurredTime < now - 30 * 24 * 60 * 60 * 1000 || occurredTime > now + 5 * 60 * 1000) return null;

  if (type === 'lesson') {
    const correct = boundedInteger(event.correct, 0, 20);
    const total = boundedInteger(event.total, 1, 20);
    if (correct === null || total === null || correct > total) return null;
    const maximumGold = correct * 12;
    const maximumXp = correct * 25;
    return {
      id,
      type,
      occurredAt: new Date(occurredTime).toISOString(),
      gold: Math.min(boundedInteger(event.gold, 0, maximumGold) ?? 0, maximumGold),
      xp: Math.min(boundedInteger(event.xp, 0, maximumXp) ?? 0, maximumXp),
    };
  }

  if (type === 'pronunciation') {
    const toneScore = boundedInteger(event.toneScore, 0, 100) ?? 0;
    return { id, type, occurredAt: new Date(occurredTime).toISOString(), gold: toneScore >= 80 ? 15 : 0, xp: toneScore >= 80 ? 20 : 5 };
  }

  const rewardKey = typeof event.rewardKey === 'string' ? event.rewardKey : '';
  const reward = DAILY_REWARDS.get(rewardKey);
  if (!reward) return null;
  const cycleKey = new Date(occurredTime).toISOString().slice(0, 10);
  return { id: `${cycleKey}:${rewardKey}`, type, occurredAt: new Date(occurredTime).toISOString(), ...reward };
}

export async function ensureBalance(connection: DatabaseConnection, userId: string) {
  await connection.execute('INSERT OR IGNORE INTO account_balances(user_id) VALUES (?)', [userId]);
}

export async function getBalance(connection: DatabaseConnection, userId: string) {
  await ensureBalance(connection, userId);
  const [rows] = await connection.execute<AccountBalanceRow[]>(
    'SELECT gold, xp, level, xp_needed AS xpNeeded FROM account_balances WHERE user_id = ? LIMIT 1',
    [userId],
  );
  return rows[0];
}

export async function applyLearningClaims(connection: DatabaseConnection, userId: string, values: unknown) {
  const events = Array.isArray(values) ? values.slice(-500) : [];
  let goldAward = 0;
  let xpAward = 0;
  const goldReferences: Array<{ id: string; amount: number }> = [];

  for (const value of events) {
    const claim = normalizeClaim(value);
    if (!claim) continue;
    const [, result] = await connection.execute(
      `INSERT OR IGNORE INTO processed_learning_events
        (user_id, event_id, event_type, awarded_gold, awarded_xp, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, claim.id, claim.type, claim.gold, claim.xp, claim.occurredAt],
    );
    if (!result?.affectedRows) continue;
    goldAward += claim.gold;
    xpAward += claim.xp;
    if (claim.gold > 0) goldReferences.push({ id: claim.id, amount: claim.gold });
  }

  const balance = await getBalance(connection, userId);
  let nextXp = Number(balance.xp) + xpAward;
  let nextLevel = Number(balance.level);
  let nextXpNeeded = Number(balance.xpNeeded);
  while (nextXp >= nextXpNeeded) {
    nextXp -= nextXpNeeded;
    nextLevel += 1;
    nextXpNeeded = Math.max(nextXpNeeded + 1, Math.floor(nextXpNeeded * 1.35));
  }
  const nextGold = Number(balance.gold) + goldAward;
  if (goldAward > 0 || xpAward > 0) {
    await connection.execute(
      `UPDATE account_balances SET gold = ?, xp = ?, level = ?, xp_needed = ?,
              updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE user_id = ?`,
      [nextGold, nextXp, nextLevel, nextXpNeeded, userId],
    );
    let runningGold = Number(balance.gold);
    for (const reference of goldReferences) {
      runningGold += reference.amount;
      await connection.execute(
        `INSERT OR IGNORE INTO gold_transactions
          (id, user_id, amount, balance_after, reason, reference_key) VALUES (?, ?, ?, ?, ?, ?)`,
        [randomUUID(), userId, reference.amount, runningGold, 'learning_reward', `learning:${reference.id}`],
      );
    }
  }

  return { gold: nextGold, xp: nextXp, level: nextLevel, xpNeeded: nextXpNeeded };
}

export function mergeAuthoritativeProgress(snapshot: Record<string, unknown>, balance: AccountBalanceRow | { gold: number; xp: number; level: number; xpNeeded: number }) {
  const stats = snapshot.stats && typeof snapshot.stats === 'object' && !Array.isArray(snapshot.stats)
    ? snapshot.stats as Record<string, unknown>
    : {};
  return {
    ...snapshot,
    stats: {
      ...stats,
      gold: Number(balance.gold),
      xp: Number(balance.xp),
      level: Number(balance.level),
      xpNeeded: Number(balance.xpNeeded),
    },
  };
}
