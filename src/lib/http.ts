export const noStore = { 'Cache-Control': 'no-store' };
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host || request.headers.get('sec-fetch-site') === 'cross-site') return false;
  try {
    const parsed = new URL(origin);
    // Next may construct request.url with its internal listener hostname.
    // Use the actual HTTP Host header; do not trust arbitrary forwarded hosts.
    return parsed.origin === origin && parsed.host === host && parsed.protocol === new URL(request.url).protocol;
  } catch { return false; }
}
