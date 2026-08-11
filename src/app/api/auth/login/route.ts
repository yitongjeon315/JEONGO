import type { RowDataPacket } from 'mysql2';
import { publicUser } from '@/lib/server/auth-response';
import { getDb } from '@/lib/server/db';
import { verifyPassword } from '@/lib/server/password';
import { isSameOriginRequest, isValidEmail, jsonError, normalizeEmail } from '@/lib/server/request';
import { createSession, type AuthUser } from '@/lib/server/session';

export const runtime = 'nodejs';

interface LoginUserRow extends RowDataPacket, AuthUser {
  passwordHash: string;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return jsonError('허용되지 않은 요청입니다.', 403);

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = normalizeEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';
    if (!isValidEmail(email) || password.length < 1 || password.length > 128) {
      return jsonError('이메일 또는 비밀번호가 올바르지 않습니다.', 401);
    }

    const [rows] = await getDb().execute<LoginUserRow[]>(
      'SELECT id, email, name, role, password_hash AS passwordHash FROM users WHERE email = ? LIMIT 1',
      [email],
    );
    const user = rows[0];
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return jsonError('이메일 또는 비밀번호가 올바르지 않습니다.', 401);
    }

    await createSession(user.id);
    return Response.json({ user: publicUser(user) });
  } catch (error) {
    console.error('Login failed', error);
    if (error instanceof Error && error.message === 'DATABASE_NOT_CONFIGURED') {
      return jsonError('MySQL 연결 설정이 필요합니다.', 503);
    }
    return jsonError('로그인을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.', 500);
  }
}
