export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  try {
    const originHost = new URL(origin).host;
    const requestHost =
      request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? new URL(request.url).host;
    return originHost === requestHost;
  } catch {
    return false;
  }
}

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function isValidEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
