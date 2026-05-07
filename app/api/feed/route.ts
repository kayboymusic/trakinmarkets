import { NextResponse } from "next/server";
import { getCachedFeed } from "@/lib/redis";
import { supabaseServer, hasSupabase } from "@/lib/supabase/server";
import type { FeedItem, Platform, TimeWindow } from "@/types";

export const dynamic = "force-dynamic";

const VALID_WINDOWS: TimeWindow[] = ["15m", "1h", "4h"];

async function fallbackFeed(window: TimeWindow): Promise<FeedItem[]> {
  if (!hasSupabase()) return [];
  const db = supabaseServer();
  const since = new Date(Date.now() - 60 * 60_000).toISOString();
  const { data, error } = await db
    .from("moves")
    .select("window:time_window, prob_from, prob_to, delta, score, detected_at, market:markets(*)")
    .eq("time_window", window)
    .gte("detected_at", since)
    .order("score", { ascending: false })
    .limit(30);
  if (error || !data) return [];
  return data
    .map((r) => {
      const market = Array.isArray(r.market) ? r.market[0] : r.market;
      if (!market) return null;
      const probFrom = Number(r.prob_from);
      const probTo = market.probability ?? Number(r.prob_to);
      return {
        market,
        move: {
          window: r.window as TimeWindow,
          prob_from: probFrom,
          prob_to: probTo,
          delta: probTo - probFrom,
          score: Number(r.score),
          detected_at: r.detected_at,
        },
        sparkline: [],
      } as FeedItem;
    })
    .filter(Boolean) as FeedItem[];
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const windowParam = (url.searchParams.get("window") ?? "15m") as TimeWindow;
  const window: TimeWindow = VALID_WINDOWS.includes(windowParam) ? windowParam : "15m";
  const platform = (url.searchParams.get("platform") ?? "all") as Platform | "all";
  const minDelta = Number(url.searchParams.get("minDelta") ?? "5") / 100;

  let items = (await getCachedFeed(window)) ?? (await fallbackFeed(window));

  if (platform !== "all") items = items.filter((i) => i.market.platform === platform);
  if (minDelta > 0) items = items.filter((i) => Math.abs(i.move.delta) >= minDelta);

  return NextResponse.json({ window, count: items.length, items });
}
