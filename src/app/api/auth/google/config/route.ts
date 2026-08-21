export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? '';
  return Response.json({ configured: Boolean(clientId), clientId: clientId || null });
}
