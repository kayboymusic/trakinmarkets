# trakin-markets

Real-time prediction-market mover detection on top of Polymarket and Kalshi (Bayse adapter scaffolded but disabled). Live at <https://trakinmarketsofc.vercel.app>. Source of truth for everything below is the running code — paths and constants here are pointers, not promises.

@AGENTS.md

## Architecture in one paragraph

GitHub Actions cron (every ~5 min) hits `POST /api/cron/ingest` then `POST /api/cron/rank` on the deployed Vercel app. Ingest pulls Polymarket Gamma + Kalshi public APIs, normalizes both into `markets`, inserts a row into `snapshots` with the current probability. Rank queries snapshots from 15m / 1h / 4h ago, computes deltas, filters by per-window thresholds, inserts into `moves`, builds a top-N feed per window, caches each feed in Upstash Redis, and broadcasts alert-worthy moves to Telegram subscribers. The web UI is a single dark-mode page polling `/api/feed` via SWR every 15s.

## Layout

```
app/
  api/
    cron/{ingest,rank}/   POST — pipeline triggers, CRON_SECRET-guarded
    feed/                 GET  — top movers (Redis-cached, Postgres fallback)
    markets/[id]/         GET  — market detail + stubbed attribution
    telegram/webhook/     POST — Telegram bot updates, X-Telegram-Bot-Api-Secret-Token-guarded
  page.tsx                Feed UI
  layout.tsx              Dark-only, Geist fonts
components/
  feed/      FeedList, FeedCard, SearchInput, CategoryBar, FeedFilters, Sparkline (custom SVG), DeltaPill, PlatformBadge
  detail/    DetailModal, ProbabilityChart (Recharts), Timeline (stubbed)
  shell/     Header, ThemeProvider (forcedTheme="dark")
  ui/        shadcn primitives — DO NOT hand-edit; use `npx shadcn@latest add <component>` to extend
lib/
  ingest/    polymarket.ts, kalshi.ts, bayse.ts (stubbed), categories.ts (priority list + synonyms)
  detect/moves.ts          THRESHOLDS map (per-window minDelta + minLiquidity)
  rank/score.ts            |delta| × log10(liq+10) × halflife(30m)
  attribution/stub.ts      deterministic mock timeline — real attribution deferred (cost decision)
  notify/telegram.ts       sendMessage, formatAlert (HTML), broadcast w/ rate-limit handling
  redis.ts                 Upstash client + getCachedFeed / setCachedFeed / wasAlerted / markAlerted
  supabase/{server,browser}.ts
  auth.ts                  CRON_SECRET bearer guard, lenient in dev
  format.ts, utils.ts
supabase/migrations/        0001 init · 0002 image_url · 0003 kalshi platform · 0004 subscribers
scripts/telegram-set-webhook.ts  one-shot to register webhook with Telegram
.github/workflows/cron.yml  GitHub Actions: 5-min cron hitting prod ingest + rank (Vercel Hobby
                            doesn't allow sub-daily crons; this is the workaround)
```

## Conventions worth preserving

- **Per-window thresholds** live in `lib/detect/moves.ts:THRESHOLDS`. 15m is intentionally looser (3pp / $1k) than 1h/4h (5pp / $5k) because most markets don't shift 5pp in 15 min and the ones that do tend to be thinner. Don't unify them.
- **Alert thresholds are separate** from detection thresholds. `ALERT_MIN_DELTA` (default 0.10) and `ALERT_MIN_LIQUIDITY` (default 10000) gate the Telegram broadcast and are read in `app/api/cron/rank/route.ts:broadcastAlerts`. Detection can fire at 3pp; alerts only fire at 10pp.
- **`window` is a reserved word in Postgres** — the column is `time_window` in `moves`. The supabase-js layer aliases it back to `window` on reads via `select("window:time_window, ...")`.
- **Categories** come from a priority list in `lib/ingest/categories.ts:CATEGORY_PRIORITY` (9 entries) with a `SYNONYMS` map for source-specific labels (`Elections → Politics`, `Climate and Weather → Climate`, etc.). To add a new category, add to the priority list and update the API's `countCategories` in `app/api/feed/route.ts` if needed.
- **Env-var pasting eats whitespace.** Vercel's UI sometimes saves trailing whitespace on pasted secrets. Both `lib/auth.ts` (CRON_SECRET) and `app/api/telegram/webhook/route.ts` (TELEGRAM_WEBHOOK_SECRET) `.trim()` defensively. If you add a new secret comparison, do the same.
- **`shadcn` `Button` does NOT support `asChild` in this preset (`base-nova` + `@base-ui/react`).** To style an `<a>` like a button, use `buttonVariants(...)` and apply the className directly. Same goes for any other primitive that you'd normally polymorphically render.
- **`<Toggle>` active state** uses `data-pressed` (Base UI), not `data-state="on"` (Radix). Use `data-[pressed]:bg-foreground/10` in className overrides.

## Migrations workflow

The Supabase project is on the user's account (NOT accessible via the Supabase MCP server connected here). Schema changes require:

1. Author SQL into `supabase/migrations/000N_<description>.sql` (idempotent — `if not exists`, `drop constraint if exists`, etc.)
2. **Hand the SQL to the user** to paste into Supabase Dashboard → SQL Editor → Run. They'll confirm.
3. **Only after** the migration is applied, push the code that depends on the new schema. Otherwise prod ingest fails with PostgREST "column not found" errors.

Never assume the schema you see in `supabase/migrations/` is what's in prod — it's what *should* be in prod if the user ran every migration. Check `select column_name from information_schema.columns where table_name='markets'` if in doubt.

## Cron + secret model

| Where | What | Token |
| --- | --- | --- |
| GitHub Actions (`.github/workflows/cron.yml`) | every ~5 min | sends `Authorization: Bearer ${{ secrets.CRON_SECRET }}` to ingest + rank |
| Vercel runtime | reads `CRON_SECRET` env var, compares with `lib/auth.ts:requireCronAuth` (trimmed) | |
| Telegram → Vercel | webhook updates from Telegram | sends `X-Telegram-Bot-Api-Secret-Token` matching `TELEGRAM_WEBHOOK_SECRET` |
| Vercel cron in `vercel.json` | **intentionally empty** — Hobby tier only allows daily, useless for our cadence | — |

GitHub secrets in `kayboymusic/trakinmarkets`: `APP_URL`, `CRON_SECRET`. Never put any other secret there.

## Env vars (full list, all required in production)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `CRON_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `ALERT_MIN_DELTA`, `ALERT_MIN_LIQUIDITY`, `APP_URL`. Optional: `BAYSE_API_KEY`, `BAYSE_API_SECRET` (adapter no-ops without them). Local dev has these in `.env.local`; prod has them in Vercel project settings.

## How to run things

```bash
npm run dev        # localhost:3000 (port may shift if 3000 is taken)
npm run build      # next build with typecheck + lint
```

Trigger the pipeline manually against prod:

```bash
curl -X POST https://trakinmarketsofc.vercel.app/api/cron/ingest \
  -H "Authorization: Bearer $CRON_SECRET"
curl -X POST https://trakinmarketsofc.vercel.app/api/cron/rank \
  -H "Authorization: Bearer $CRON_SECRET"
```

Register the Telegram webhook (after creating bot + adding env vars):

```bash
TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... APP_URL=... \
  npx tsx scripts/telegram-set-webhook.ts
```

## What's deferred (not bugs)

- **Real attribution.** The "See why" timeline pulls from `lib/attribution/stub.ts` — fake sources, fake headlines, deterministic by market id. Replacing with Claude `web_search` was scoped and costed; user opted to defer until budget. Until that's built, do NOT pretend the modal is showing real news.
- **Bayse.** Adapter exists, requires HMAC-signed creds from <https://docs.bayse.markets>. Returns `[]` and logs `[bayse] skipped: missing credentials` until `BAYSE_API_KEY` + `BAYSE_API_SECRET` are set.
- **Auth.** No user accounts. The Telegram bot is the only persistent per-user state (in `subscribers` table).
- **Velocity / consensus / per-user alert customization.** Discussed, not built.
