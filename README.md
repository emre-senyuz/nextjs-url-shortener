# nextjs-url-shortener

A complete local URL shortener built with Next.js App Router, strict TypeScript, Tailwind CSS, better-sqlite3, Zod, and lucide-react. No accounts, paid services, or cloud database.

## Run locally

Use Node.js 22.13+ (Node.js 24 LTS recommended) and npm.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000. Paste a public HTTP/HTTPS URL, create a link, and copy it. The UI uses `window.location.origin`, so links always match the address you opened. Open a short link in another tab to redirect and increment its count; return to the app to refresh counts automatically, or use Refresh.

```sh
npm run typecheck
npm run build
npm start
```

Both start scripts bind to loopback by default. To choose another port: `npm run dev -- --port 3001` or `npm start -- --port 3001`. Stop the dev server before starting production on the same port. No test suite is included.

## Persistence and behavior

- The first database access automatically creates `data/links.sqlite` and the schema. No seed or migration command is needed; the app starts with an intentional empty state.
- SQLite uses WAL mode, a busy timeout, parameterized queries, and an index for recent links. Database files are ignored by Git. Keep `data/` to preserve links across restarts. Stop the app before removing this directory to reset the demo.
- Slugs contain seven cryptographically random alphanumeric characters. An atomic primary-key conflict check retries collisions without overwriting existing links.
- `GET /api/links` returns the newest 50 links. `POST /api/links` accepts JSON `{ "url": "https://example.com" }`. `DELETE /api/links/[slug]` removes a link. Mutations require an `Origin` matching the request URL, and creation requires JSON. When calling manually, include `Origin: http://127.0.0.1:3000`.
- `GET /s/[slug]` validates the slug and destination, atomically increments clicks, and issues a non-cacheable 302. HEAD requests do not increment counts. Counts represent redirect requests, including bots, not unique people.
- Deletion requires browser confirmation. Missing or deleted slugs return 404. Destination errors and database failures have explicit responses.
- Clipboard access generally requires localhost or HTTPS; if unavailable, select the displayed short URL and copy manually.

## Public-deployment safety warning

**This is a local demo, not a production-ready public shortener.** Short URLs are not publicly accessible unless this app is deployed and reachable at their origin. Anyone who can access this instance can list, create, and delete links. There is no ownership boundary or private administration area. Do not store confidential URLs here.

Before any public release, add rate limiting, quotas and abuse protection for anonymous creation, moderation/takedown controls, and authorization for listing/deleting links. Add monitoring, backups, request timeouts/body limits at the reverse proxy, HTTPS, and a correctly configured trusted public origin. The current exact-origin mutation check is CSRF hardening, not authentication; scripts can supply their own Origin header. Behind a proxy, configure forwarded host/protocol handling deliberately rather than loosening this check blindly.

Validation allows only HTTP/HTTPS, disallows URL credentials, and blocks obvious localhost/private-network destinations: single-label/local hostnames and non-public IP ranges, including IPv4-mapped IPv6. WHATWG URL parsing normalizes unusual numeric IPv4 forms before checking. Destinations are checked again at redirect time. The server never fetches destination content or resolves destination DNS. Hostnames may still resolve to private addresses, change DNS later, or redirect elsewhere. This practical filter is **not a complete destination reputation or network safety guarantee**. A public service needs stronger destination abuse controls and operational policies.

Run on a persistent Node.js host with writable disk. This native SQLite implementation is not designed for Edge runtimes, ephemeral serverless storage, or multiple replicas with independent files. `better-sqlite3` normally installs a prebuilt binary on supported Node/platform combinations; otherwise a native compiler toolchain is required. Dependencies are locked in `package-lock.json` after installation.

## Source layout

- `src/components/shortener.tsx`: responsive UI, creation/copy/deletion, recent links, feedback and empty/loading states.
- `src/app/api/links/`: list/create/delete route handlers.
- `src/app/s/[slug]/route.ts`: redirect and click counting.
- `src/lib/db.ts`: lazy SQLite schema and parameterized operations.
- `src/lib/validation.ts`: Zod input and destination validation.

Route handlers use the async route parameters documented in the [Next.js App Router documentation](https://nextjs.org/docs/app/getting-started/route-handlers).
