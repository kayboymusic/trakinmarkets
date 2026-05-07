import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { setCachedFeed } from "@/lib/redis";
import { WINDOW_MINUTES, isSignificant } from "@/lib/detect/moves";
import { score } from "@/lib/rank/score";
import { requireCronAuth } from "@/lib/auth";
import type { FeedItem, Market, TimeWindow } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TOP_N = 30;
const SPARKLINE_HOURS = 24;
const SPARKLINE_POINTS = 60;

async function detectForWindow(window: TimeWindow, markets: Market[]) {
  const db = supabaseServer();
  const minutes = WINDOW_MINUTES[window];
  const cutoffNew = new Date(Date.now() - minutes * 60_000).toISOString();
  const cutoffOld = new Date(Date.now() - (minutes * 2 + 5) * 60_000).toISOString();

  const { data: pastRows, error } = await db
    .from("snapshots")
    .select("market_id, probability, ts")
    .lte("ts", cutoffNew)
    .gte("ts", cutoffOld);
  if (error) throw new Error(`snapshots query: ${error.message}`);

  const latestPast = new Map<string, { probability: number; ts: string }>();
  for (const r of pastRows ?? []) {
    const cur = latestPast.get(r.market_id);
    if (!cur || cur.ts < r.ts) latestPast.set(r.market_id, { probability: r.probability, ts: r.ts });
  }

  const detectedAt = new Date().toISOString();
  const rows: Array<{
    market_id: string;
    time_window: TimeWindow;
    prob_from: number;
    prob_to: number;
    delta: number;
    score: number;
    detected_at: string;
  }> = [];

  for (const m of markets) {
    if (m.probability == null) continue;
    const past = latestPast.get(m.id);
    if (!past) continue;
    const delta = m.probability - past.probability;
    if (!isSignificant(delta, m.liquidity)) continue;
    rows.push({
      market_id: m.id,
      time_window: window,
      prob_from: past.probability,
      prob_to: m.probability,
      delta,
      score: score(delta, m.liquidity, detectedAt),
      detected_at: detectedAt,
    });
  }

  if (rows.length) {
    const { error: insErr } = await db.from("moves").insert(rows);
    if (insErr) console.warn(`[rank] insert moves ${window}:`, insErr.message);
  }
  return rows.length;
}

async function buildFeed(window: TimeWindow): Promise<FeedItem[]> {
  const db = supabaseServer();
  const since = new Date(Date.now() - 60 * 60_000).toISOString();

  const { data: moves, error } = await db
    .from("moves")
    .select(
      "window:time_window, prob_from, prob_to, delta, score, detected_at, market:markets(*)",
    )
    .eq("time_window", window)
    .gte("detected_at", since)
    .order("score", { ascending: false })
    .limit(TOP_N);
  if (error) throw new Error(`moves query: ${error.message}`);

  const items: FeedItem[] = [];
  const sinceSpark = new Date(Date.now() - SPARKLINE_HOURS * 3600_000).toISOString();

  // dedupe: keep highest-score row per market_id
  const bestByMarket = new Map<string, typeof moves[number]>();
  for (const row of moves ?? []) {
    const market = (Array.isArray(row.market) ? row.market[0] : row.market) as Market | null;
    if (!market) continue;
    const cur = bestByMarket.get(market.id);
    if (!cur || Number(row.score) > Number(cur.score)) bestByMarket.set(market.id, row);
  }

  await Promise.all(
    Array.from(bestByMarket.values()).map(async (row) => {
      const market = (Array.isArray(row.market) ? row.market[0] : row.market) as Market;
      const { data: spark } = await db
        .from("snapshots")
        .select("ts, probability")
        .eq("market_id", market.id)
        .gte("ts", sinceSpark)
        .order("ts", { ascending: true })
        .limit(SPARKLINE_POINTS);
      const probFrom = Number(row.prob_from);
      const probTo = market.probability ?? Number(row.prob_to);
      const delta = probTo - probFrom;
      items.push({
        market,
        move: {
          window: row.window as TimeWindow,
          prob_from: probFrom,
          prob_to: probTo,
          delta,
          score: Number(row.score),
          detected_at: row.detected_at,
        },
        sparkline: (spark ?? []).map((s) => ({
          ts: s.ts,
          probability: Number(s.probability),
        })),
      });
    }),
  );

  items.sort((a, b) => b.move.score - a.move.score);
  return items.slice(0, TOP_N);
}

export async function POST(req: Request) {
  const guard = requireCronAuth(req);
  if (guard) return guard;

  const db = supabaseServer();
  const { data: markets, error } = await db
    .from("markets")
    .select("id, platform, native_id, title, url, category, liquidity, volume, probability, closes_at, updated_at")
    .not("probability", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const detected = {
    "15m": await detectForWindow("15m", (markets ?? []) as Market[]),
    "1h": await detectForWindow("1h", (markets ?? []) as Market[]),
    "4h": await detectForWindow("4h", (markets ?? []) as Market[]),
  };

  const feeds: Record<TimeWindow, number> = { "15m": 0, "1h": 0, "4h": 0 };
  for (const w of ["15m", "1h", "4h"] as TimeWindow[]) {
    const items = await buildFeed(w);
    await setCachedFeed(w, items, 120);
    feeds[w] = items.length;
  }

  return NextResponse.json({ ok: true, detected, feeds });
}

export async function GET(req: Request) {
  return POST(req);
}
