import { DEFAULT_CONTENT_CATALOG, parseContentCatalog } from '@/lib/content-catalog';
import { getContentCatalog, replaceContentCatalog } from '@/lib/server/content';
import { isDatabaseConfigured } from '@/lib/server/db';
import { isSameOriginRequest, jsonError } from '@/lib/server/request';
import { getCurrentUser } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isDatabaseConfigured()) {
    return Response.json({ catalog: DEFAULT_CONTENT_CATALOG, databaseConfigured: false });
  }
  try {
    return Response.json({ catalog: await getContentCatalog(), databaseConfigured: true });
  } catch (error) {
    console.error('Content catalog lookup failed', error);
    return jsonError('공용 콘텐츠를 불러오지 못했습니다.', 500);
  }
}

export async function PUT(request: Request) {
  if (!isSameOriginRequest(request)) return jsonError('허용되지 않은 요청입니다.', 403);
  if (!isDatabaseConfigured()) return jsonError('MySQL 연결 설정이 필요합니다.', 503);

  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('로그인이 필요합니다.', 401);
    if (user.role !== 'admin') return jsonError('관리자만 콘텐츠를 변경할 수 있습니다.', 403);

    const body = (await request.json().catch(() => null)) as { catalog?: unknown } | null;
    const parsed = parseContentCatalog(body?.catalog);
    if (!parsed.ok) return jsonError(parsed.error, 400);

    await replaceContentCatalog(parsed.catalog);
    return Response.json({ catalog: parsed.catalog });
  } catch (error) {
    console.error('Content catalog save failed', error);
    return jsonError('공용 콘텐츠를 저장하지 못했습니다.', 500);
  }
}
