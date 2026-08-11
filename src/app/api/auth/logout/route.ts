import { isDatabaseConfigured } from '@/lib/server/db';
import { isSameOriginRequest, jsonError } from '@/lib/server/request';
import { deleteCurrentSession } from '@/lib/server/session';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return jsonError('허용되지 않은 요청입니다.', 403);

  try {
    if (isDatabaseConfigured()) await deleteCurrentSession();
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Logout failed', error);
    return jsonError('로그아웃을 처리하지 못했습니다.', 500);
  }
}
