import { publicUser, optionalCurrentUser } from '@/lib/server/auth-response';
import { isDatabaseConfigured } from '@/lib/server/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await optionalCurrentUser();
    return Response.json({
      user: user ? publicUser(user) : null,
      databaseConfigured: isDatabaseConfigured(),
    });
  } catch (error) {
    console.error('Session lookup failed', error);
    return Response.json({ user: null, databaseConfigured: true }, { status: 503 });
  }
}
