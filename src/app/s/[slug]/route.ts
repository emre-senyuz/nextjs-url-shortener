import { countClick, getLink } from '@/lib/db';
import { safeDestination, slugSchema } from '@/lib/validation';
import { noStore } from '@/lib/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function redirect(context: { params: Promise<{ slug: string }> }, count: boolean) {
  const { slug } = await context.params;
  if (!slugSchema.safeParse(slug).success) return new Response('Link not found.', { status: 404, headers: noStore });
  try {
    const link = getLink(slug);
    if (!link) return new Response('This link does not exist or was deleted.', { status: 404, headers: noStore });
    if (!safeDestination(link.url)) return new Response('This destination is blocked.', { status: 410, headers: noStore });
    if (count && !countClick(slug)) return new Response('Link not found.', { status: 404, headers: noStore });
    return new Response(null, { status: 302, headers: { ...noStore, Location: link.url, 'Referrer-Policy': 'no-referrer' } });
  } catch { return new Response('Unable to open this link. Please try again.', { status: 503, headers: noStore }); }
}
export function GET(_request: Request, context: { params: Promise<{ slug: string }> }) { return redirect(context, true); }
export function HEAD(_request: Request, context: { params: Promise<{ slug: string }> }) { return redirect(context, false); }
