# trakin — Belief Intelligence

Real-time prediction market movements, ranked by significance, with stubbed attribution.
Aggregates Polymarket and Bayse, surfaces top movers in 15m / 1h / 4h windows.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind v4 + shadcn/ui (dark-only)
- Supabase Postgres · Upstash Redis · Recharts · SWR

## Setup

### 1. Supabase

1. Create a project at <https://supabase.com/dashboard>.
2. Open the SQL editor and run the contents of `supabase/migrations/0001_init.sql`.
3. From Project Settings → API, copy the URL, the publishable (anon) key, and the service role key into `.env.local`.

### 2. Upstash Redis (optional but recommended)

1. Create a Redis database at <https://console.upstash.com/redis>.
2. From the REST API tab, copy the URL and token into `.env.local`.

The app boots without Redis — `/api/feed` falls back to a direct Postgres query (slower, fine for dev).

### 3. Env

```bash
cp .env.example .env.local
# fill in values, including:
# CRON_SECRET=$(openssl rand -hex 32)
```

### 4. Run

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Pipeline

```
External APIs ─► /api/cron/ingest ─► Supabase (markets, snapshots)
                                          │
                                          ▼
                       /api/cron/rank ─► detect moves ─► Redis cache (feed:1h, feed:15m, feed:4h)
                                                                 │
                                                                 ▼
                                                          /api/feed → UI
```

### Trigger ingestion locally

```bash
curl -X POST http://localhost:3000/api/cron/ingest \
  -H "Authorization: Bearer $CRON_SECRET"
# wait 30+ seconds for two snapshots to land
curl -X POST http://localhost:3000/api/cron/rank \
  -H "Authorization: Bearer $CRON_SECRET"
# refresh http://localhost:3000
```

In dev, the auth header is optional (only enforced when `NODE_ENV=production`).

## Deployment (Vercel)

1. `vercel link` and import the repo.
2. Add all env vars from `.env.example` to the project.
3. Crons in `vercel.json` run `/api/cron/ingest` and `/api/cron/rank` every minute. Vercel attaches `Authorization: Bearer $CRON_SECRET` automatically.

> Note: Vercel Cron's minimum cadence is 1 minute. The PRD calls for 30s — to hit that, either run a second timer (e.g. inside the route handler with `setTimeout`) or use Supabase `pg_cron` to invoke the routes twice per minute.

## Bayse

The Bayse adapter at `lib/ingest/bayse.ts` is scaffolded against `relay.bayse.markets` with HMAC-SHA256 signing. Endpoint paths and field names are best-effort guesses — verify against <https://docs.bayse.markets> once you have credentials, then update `fetchBayse()` accordingly. Without credentials, the adapter logs and returns `[]`.

## Project layout

```
app/
  api/
    feed/                 GET — top movers (Redis-cached)
    markets/[id]/         GET — market detail + stubbed attribution
    cron/{ingest,rank}/   POST — pipeline triggers (CRON_SECRET-guarded)
  page.tsx                Feed UI
components/
  feed/      FeedList, FeedCard, Sparkline, DeltaPill, PlatformBadge, FeedFilters
  detail/    DetailModal, ProbabilityChart, Timeline
  shell/     Header, ThemeProvider
  ui/        shadcn primitives
lib/
  ingest/    polymarket, bayse adapters
  detect/    significance threshold
  rank/      |delta| × liquidityWeight × recencyWeight
  attribution/ stub.ts (deterministic mock timeline)
  supabase/  server + browser clients
  redis.ts   Upstash client + feed cache helpers
supabase/migrations/0001_init.sql
```

## Out of scope (deferred)

- Auth, watchlists, alerts
- Real attribution (keyword / LLM)
- WebSocket push
- Kalshi adapter
- TimescaleDB hypertables
