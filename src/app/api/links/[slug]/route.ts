import { deleteLink } from '@/lib/db';
import { slugSchema } from '@/lib/validation';
import { sameOrigin, noStore } from '@/lib/http';
export const runtime = 'nodejs';
export async function DELETE(request: Request, context: { params: Promise<{ slug: string }> }) {
  if (!sameOrigin(request)) return Response.json({ error: 'Same-origin requests required.' }, { status: 403 });
  const { slug } = await context.params;
  if (!slugSchema.safeParse(slug).success) return Response.json({ error: 'Invalid link.' }, { status: 400 });
  try {
    if (!deleteLink(slug)) return Response.json({ error: 'Link already removed. Refresh the list.' }, { status: 404 });
    return new Response(null, { status: 204, headers: noStore });
  } catch { return Response.json({ error: 'Could not delete link.' }, { status: 500 }); }
}
