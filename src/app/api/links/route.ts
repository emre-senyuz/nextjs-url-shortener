import { createLink, recentLinks } from '@/lib/db';
import { createSchema } from '@/lib/validation';
import { noStore, sameOrigin } from '@/lib/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET() {
  try { return Response.json({ links: recentLinks() }, { headers: noStore }); }
  catch { return Response.json({ error: 'Could not load links. Please try again.' }, { status: 500, headers: noStore }); }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Same-origin requests required.' }, { status: 403 });
  if (!request.headers.get('content-type')?.includes('application/json')) return Response.json({ error: 'JSON required.' }, { status: 415 });
  // Limit streamed bodies as well as requests with a Content-Length header.
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ error: 'A URL is required.' }, { status: 400 });
  let text = ''; let bytes = 0; const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 16384) { await reader.cancel(); return Response.json({ error: 'Request too large.' }, { status: 413 }); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    const parsed = createSchema.safeParse(JSON.parse(text));
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
    return Response.json({ link: createLink(parsed.data.url) }, { status: 201, headers: noStore });
  } catch (error) {
    return Response.json({ error: error instanceof SyntaxError ? 'Invalid JSON.' : 'Could not create your link. Please try again.' }, { status: error instanceof SyntaxError ? 400 : 500 });
  }
}
