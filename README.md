# AdSpot — Unified Application (frontend + api-server)

One application: the landing page is the entry point, and the API server is
included so login/signup work.

| Path        | What it is                                      |
|-------------|--------------------------------------------------|
| `/`         | Landing page (entry point)                       |
| `/earn/*`   | Reviewer platform — "Start Earning"              |
| `/brands/*` | Brand + Admin platform                           |
| `/api/*`    | REST API (auth, ads, reviews, payouts, admin)    |

## Layout
- `app/` — the unified React frontend (landing + earn + brands, one router)
- `server/` — the Express api-server (auth, ads, reviews, payouts, admin)
- `lib/` — shared packages (api client, db/drizzle, zod contracts, storage, AI)

## Run it (Node 20+, pnpm 9+)
```bash
pnpm install
cp server/.env.example server/.env   # fill in DATABASE_URL, JWT_SECRET, AI vars
pnpm build                            # builds server + frontend
export $(grep -v '^#' server/.env | xargs)
pnpm start                            # ONE server: frontend + /api on one origin
```
Open http://localhost:3001 — landing page loads, and login/signup post to
`/api/auth/*` on the same origin (no proxy, no CORS issues).

### Development (two processes, auto-reload)
```bash
pnpm dev:api    # api-server on :3001
pnpm dev:app    # vite on :5173, proxies /api -> :3001
```

### Database
The server needs PostgreSQL (`DATABASE_URL`). Create the schema with the SQL in
`lib/db` (drizzle) or point at your existing AdSpot database. Login/signup hit
`/api/auth/register` and `/api/auth/login` and work once the DB is reachable.

## Verified (run for real from a clean extract of this zip)
- `pnpm install` exit 0 · `pnpm typecheck` 0 errors · `pnpm build` exit 0
- One-origin boot test: `/`, `/earn`, `/brands/login` all HTTP 200 from the
  api-server (SPA fallback), `/api/healthz` returns `{"status":"ok"}`, and
  `POST /api/auth/login` reaches the auth route (returns a real validation
  response). Completing login/signup requires your `DATABASE_URL` (not
  available in the build sandbox).

## Hardening & quality gates (v2)
- helmet security headers; CORS locked to same-origin by default (`CORS_ORIGINS` env allowlist to open).
- Rate limiting: 300 req/min per IP on `/api`, **20 attempts / 15 min on `/api/auth`** (brute-force protection) — verified live (HTTP 429 at attempt 21).
- Section-level React error boundaries: a crash in landing/earn/brands no longer blanks the app.
- Tests: `pnpm test` (14: JWT lifecycle, auth guard, role hierarchy incl. super-admin bypass, bcrypt, session-token routing).
- Lint: `pnpm lint` — 0 errors in app and server (shadcn ui vendor files excluded).
- CI: `.github/workflows/ci.yml` runs typecheck + lint + test + build on every push.
