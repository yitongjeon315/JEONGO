import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2';
import { getDb } from '@/lib/server/db';
import { hashPassword } from '@/lib/server/password';
import { isSameOriginRequest, isValidEmail, jsonError, normalizeEmail } from '@/lib/server/request';
import { createSession, type AuthUser } from '@/lib/server/session';
import { publicUser } from '@/lib/server/auth-response';

export const runtime = 'nodejs';

interface ExistingUserRow extends RowDataPacket {
  id: string;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return jsonError('허용되지 않은 요청입니다.', 403);

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = normalizeEmail(body.email);
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!isValidEmail(email)) return jsonError('올바른 이메일을 입력해 주세요.', 400);
    if (name.length < 2 || name.length > 40) return jsonError('이름은 2~40자로 입력해 주세요.', 400);
    if (password.length < 8 || password.length > 128) {
      return jsonError('비밀번호는 8~128자로 입력해 주세요.', 400);
    }

    const db = getDb();
    const [existing] = await db.execute<ExistingUserRow[]>('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existing.length > 0) return jsonError('이미 가입된 이메일입니다.', 409);

    const user: AuthUser = { id: randomUUID(), email, name, role: 'learner' };
    await db.execute(
      'INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)',
      [user.id, user.email, await hashPassword(password), user.name, user.role],
    );
    await createSession(user.id);
    return Response.json({ user: publicUser(user) }, { status: 201 });
  } catch (error) {
    console.error('Registration failed', error);
    if (error instanceof Error && error.message === 'DATABASE_NOT_CONFIGURED') {
      return jsonError('MySQL 연결 설정이 필요합니다.', 503);
    }
    return jsonError('회원가입을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.', 500);
  }
}
