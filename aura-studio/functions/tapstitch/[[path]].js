// Cloudflare Pages Function: same-origin relay for the Tapstitch Open Platform
// API (it does not allow browser CORS requests). Forwards only /v1/ paths, only
// to openapi.tapstitch.com, with the user's own token from the request.
export async function onRequest({ request }) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/tapstitch/, '');
  if (!path.startsWith('/v1/') || !['GET', 'POST', 'PUT', 'DELETE'].includes(request.method)) return new Response('Not found', { status: 404 });
  const headers = { accept: 'application/json' };
  const auth = request.headers.get('authorization');
  if (auth) headers.authorization = auth;
  const type = request.headers.get('content-type');
  if (type) headers['content-type'] = type;
  const r = await fetch(`https://openapi.tapstitch.com${path}${url.search}`, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
  });
  return new Response(r.body, { status: r.status, headers: { 'content-type': r.headers.get('content-type') || 'application/json', 'cache-control': 'no-store' } });
}
