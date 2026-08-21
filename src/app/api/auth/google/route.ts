import { randomUUID } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { publicUser } from '@/lib/server/auth-response';
import { getDb } from '@/lib/server/db';
import { isSameOriginRequest, isValidEmail, jsonError, normalizeEmail } from '@/lib/server/request';
import { createSession, type AuthUser } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface OAuthUserRow extends AuthUser, Record<string, unknown> {}

function adminEmails() {
  return new Set((process.env.GOOGLE_ADMIN_EMAILS ?? '').split(',').map(normalizeEmail).filter(Boolean));
}

function displayName(value: unknown, email: string) {
  const preferred = typeof value === 'string' ? value.trim().slice(0, 40) : '';
  const fallback = email.split('@')[0].slice(0, 40);
  return (preferred.length >= 2 ? preferred : fallback.length >= 2 ? fallback : 'Google 사용자');
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return jsonError('허용되지 않은 요청입니다.', 403);
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) return jsonError('Google 로그인 설정이 아직 완료되지 않았습니다.', 503);

  try {
    const body = (await request.json().catch(() => null)) as { credential?: unknown } | null;
    const credential = typeof body?.credential === 'string' ? body.credential.trim() : '';
    if (!credential || credential.length > 10_000) return jsonError('Google 로그인 정보가 올바르지 않습니다.', 400);

    const ticket = await new OAuth2Client(clientId).verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();
    const email = normalizeEmail(payload?.email);
    const subject = payload?.sub?.trim() ?? '';
    if (!payload || !payload.email_verified || !isValidEmail(email) || !subject) {
      return jsonError('이메일이 확인된 Google 계정만 사용할 수 있습니다.', 403);
    }

    const connection = await getDb().getConnection();
    let user: AuthUser | null = null;
    let created = false;
    try {
      await connection.beginTransaction();
      const [linkedRows] = await connection.execute<OAuthUserRow[]>(
        `SELECT u.id, u.email, u.name, u.role FROM oauth_accounts o
         JOIN users u ON u.id = o.user_id WHERE o.provider = 'google' AND o.provider_subject = ? LIMIT 1`,
        [subject],
      );
      const linked = linkedRows[0];
      if (linked) {
        user = linked;
      } else {
        const [emailRows] = await connection.execute<OAuthUserRow[]>(
          'SELECT id, email, name, role FROM users WHERE email = ? LIMIT 1',
          [email],
        );
        const existing = emailRows[0];
        if (existing) {
          user = existing;
        } else {
          user = {
            id: randomUUID(),
            email,
            name: displayName(payload.name, email),
            role: adminEmails().has(email) ? 'admin' : 'learner',
          };
          await connection.execute(
            'INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)',
            [user.id, user.email, 'oauth$google-only', user.name, user.role],
          );
          created = true;
        }
        await connection.execute(
          `INSERT INTO oauth_accounts (provider, provider_subject, user_id, email)
           VALUES ('google', ?, ?, ?)`,
          [subject, user.id, email],
        );
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    if (!user) throw new Error('GOOGLE_USER_NOT_CREATED');
    await createSession(user.id);
    return Response.json({ user: publicUser(user), created });
  } catch (error) {
    console.error('Google authentication failed', error);
    return jsonError('Google 로그인을 확인하지 못했습니다. 다시 시도해 주세요.', 401);
  }
}
