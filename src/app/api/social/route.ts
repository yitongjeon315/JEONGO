import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getDb } from '@/lib/server/db';
import { isSameOriginRequest, jsonError } from '@/lib/server/request';
import { getCurrentUser } from '@/lib/server/session';
import { rankLeagueMembers } from '@/lib/social';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface UserSnapshotRow extends RowDataPacket { id: string; name: string; data: string | Record<string, unknown> }
interface GuildRow extends RowDataPacket { id: string; name: string; level: number; exp: number; expNeeded: number; bossHp: number; bossMaxHp: number }
interface GuildMemberRow extends RowDataPacket { userId: string; name: string; contribution: number }
interface MembershipRow extends RowDataPacket { guildId: string }
interface GuildRecommendationRow extends GuildRow { memberCount: number }

function parseSnapshot(data: UserSnapshotRow['data']) {
  return typeof data === 'string' ? JSON.parse(data) as Record<string, unknown> : data;
}

function weeklyXp(snapshot: Record<string, unknown>) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const events = Array.isArray(snapshot.learningEvents) ? snapshot.learningEvents : [];
  return events.reduce((sum, event) => {
    if (!event || typeof event !== 'object') return sum;
    const item = event as Record<string, unknown>;
    const occurredAt = typeof item.occurredAt === 'string' ? Date.parse(item.occurredAt) : 0;
    const xp = typeof item.xp === 'number' && Number.isFinite(item.xp) ? Math.max(0, item.xp) : 0;
    return occurredAt >= weekAgo ? sum + xp : sum;
  }, 0);
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('로그인이 필요합니다.', 401);
    const db = getDb();
    const [snapshots] = await db.execute<UserSnapshotRow[]>(
      `SELECT u.id, u.name, s.data FROM users u JOIN user_snapshots s ON s.user_id = u.id
       ORDER BY s.updated_at DESC LIMIT 200`,
    );
    const leagueMembers = rankLeagueMembers(snapshots.map((row) => {
      const snapshot = parseSnapshot(row.data);
      const stats = snapshot.stats && typeof snapshot.stats === 'object' ? snapshot.stats as Record<string, unknown> : {};
      return { id: row.id, name: row.name, level: Number(stats.level ?? 1), xp: weeklyXp(snapshot), isUser: row.id === user.id };
    }), user.id);
    const [memberships] = await db.execute<MembershipRow[]>('SELECT guild_id AS guildId FROM guild_members WHERE user_id = ? LIMIT 1', [user.id]);
    const guildId = memberships[0]?.guildId;
    const [guilds] = guildId ? await db.execute<GuildRow[]>(
      'SELECT id, name, level, exp, exp_needed AS expNeeded, boss_hp AS bossHp, boss_max_hp AS bossMaxHp FROM guilds WHERE id = ? LIMIT 1', [guildId],
    ) : [[] as GuildRow[], []];
    const [members] = guildId ? await db.execute<GuildMemberRow[]>(
      `SELECT gm.user_id AS userId, u.name, gm.contribution FROM guild_members gm
       JOIN users u ON u.id = gm.user_id WHERE gm.guild_id = ? ORDER BY gm.contribution DESC LIMIT 50`, [guildId],
    ) : [[] as GuildMemberRow[], []];
    const [recommendations] = await db.execute<GuildRecommendationRow[]>(
      `SELECT g.id, g.name, g.level, g.exp, g.exp_needed AS expNeeded, g.boss_hp AS bossHp, g.boss_max_hp AS bossMaxHp,
              COUNT(gm.user_id) AS memberCount FROM guilds g LEFT JOIN guild_members gm ON gm.guild_id = g.id
       GROUP BY g.id ORDER BY memberCount DESC, g.name LIMIT 20`,
    );
    return Response.json({ league: '실버 리그 (Silver League)', leagueMembers, guild: guilds[0] ?? null, guildMembers: members.map((member) => ({ ...member, isUser: member.userId === user.id })), recommendations });
  } catch (error) {
    console.error('Social lookup failed', error);
    return jsonError(error instanceof Error && error.message === 'DATABASE_NOT_CONFIGURED' ? 'MySQL 연결 설정이 필요합니다.' : '소셜 정보를 불러오지 못했습니다.', error instanceof Error && error.message === 'DATABASE_NOT_CONFIGURED' ? 503 : 500);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return jsonError('허용되지 않은 요청입니다.', 403);
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('로그인이 필요합니다.', 401);
    const body = (await request.json()) as Record<string, unknown>;
    if (body.action === 'join') {
      const guildId = typeof body.guildId === 'string' ? body.guildId.trim().slice(0, 100) : '';
      if (!guildId) return jsonError('가입할 길드가 올바르지 않습니다.', 400);
      const connection = await getDb().getConnection();
      try {
        await connection.beginTransaction();
        const [guilds] = await connection.execute<GuildRow[]>('SELECT id, name, level, exp, exp_needed AS expNeeded, boss_hp AS bossHp, boss_max_hp AS bossMaxHp FROM guilds WHERE id = ? LIMIT 1', [guildId]);
        if (!guilds[0]) { await connection.rollback(); return jsonError('길드를 찾을 수 없습니다.', 404); }
        await connection.execute<ResultSetHeader>('DELETE FROM guild_members WHERE user_id = ?', [user.id]);
        await connection.execute<ResultSetHeader>('INSERT INTO guild_members (guild_id, user_id) VALUES (?, ?)', [guildId, user.id]);
        await connection.commit();
        return Response.json({ joined: true, guild: guilds[0] });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally { connection.release(); }
    }
    const gold = Number(body.gold);
    if (!Number.isInteger(gold) || gold < 10 || gold > 10_000) return jsonError('기여 골드가 올바르지 않습니다.', 400);
    const connection = await getDb().getConnection();
    try {
      await connection.beginTransaction();
      const [memberships] = await connection.execute<MembershipRow[]>('SELECT guild_id AS guildId FROM guild_members WHERE user_id = ? LIMIT 1 FOR UPDATE', [user.id]);
      const guildId = memberships[0]?.guildId;
      if (!guildId) { await connection.rollback(); return jsonError('먼저 길드에 가입해 주세요.', 409); }
      const [rows] = await connection.execute<UserSnapshotRow[]>('SELECT ? AS id, ? AS name, data FROM user_snapshots WHERE user_id = ? FOR UPDATE', [user.id, user.name, user.id]);
      const snapshot = rows[0] ? parseSnapshot(rows[0].data) : null;
      const stats = snapshot?.stats && typeof snapshot.stats === 'object' ? snapshot.stats as Record<string, unknown> : null;
      const currentGold = Number(stats?.gold ?? 0);
      if (!snapshot || !stats || currentGold < gold) {
        await connection.rollback();
        return jsonError('골드가 부족합니다.', 409);
      }
      stats.gold = currentGold - gold;
      await connection.execute<ResultSetHeader>('UPDATE user_snapshots SET data = CAST(? AS JSON) WHERE user_id = ?', [JSON.stringify(snapshot), user.id]);
      await connection.execute<ResultSetHeader>('UPDATE guild_members SET contribution = contribution + ? WHERE guild_id = ? AND user_id = ?', [gold, guildId, user.id]);
      const [guildRows] = await connection.execute<GuildRow[]>(
        'SELECT id, name, level, exp, exp_needed AS expNeeded, boss_hp AS bossHp, boss_max_hp AS bossMaxHp FROM guilds WHERE id = ? FOR UPDATE',
        [guildId],
      );
      const guild = guildRows[0];
      if (!guild) throw new Error('GUILD_NOT_FOUND');
      let nextExp = guild.exp + Math.floor(gold / 2);
      let nextLevel = guild.level;
      let nextExpNeeded = guild.expNeeded;
      while (nextExp >= nextExpNeeded) {
        nextExp -= nextExpNeeded;
        nextLevel += 1;
        nextExpNeeded = Math.floor(nextExpNeeded * 1.5);
      }
      const nextBossHp = Math.max(0, guild.bossHp - gold * 3);
      await connection.execute<ResultSetHeader>(
        'UPDATE guilds SET level = ?, exp = ?, exp_needed = ?, boss_hp = ? WHERE id = ?',
        [nextLevel, nextExp, nextExpNeeded, nextBossHp, guildId],
      );
      await connection.commit();
      return Response.json({ contributed: true, remainingGold: currentGold - gold, damage: gold * 3, guild: { level: nextLevel, exp: nextExp, expNeeded: nextExpNeeded, bossHp: nextBossHp } });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Guild contribution failed', error);
    return jsonError(error instanceof Error && error.message === 'DATABASE_NOT_CONFIGURED' ? 'MySQL 연결 설정이 필요합니다.' : '길드 기여를 저장하지 못했습니다.', error instanceof Error && error.message === 'DATABASE_NOT_CONFIGURED' ? 503 : 500);
  }
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) return jsonError('허용되지 않은 요청입니다.', 403);
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('로그인이 필요합니다.', 401);
    await getDb().execute<ResultSetHeader>('DELETE FROM guild_members WHERE user_id = ?', [user.id]);
    return Response.json({ left: true });
  } catch (error) {
    console.error('Guild leave failed', error);
    return jsonError(error instanceof Error && error.message === 'DATABASE_NOT_CONFIGURED' ? 'MySQL 연결 설정이 필요합니다.' : '길드에서 탈퇴하지 못했습니다.', error instanceof Error && error.message === 'DATABASE_NOT_CONFIGURED' ? 503 : 500);
  }
}
