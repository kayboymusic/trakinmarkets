import { NextResponse } from "next/server";
import { getCachedFeed } from "@/lib/redis";
import { supabaseServer, hasSupabase } from "@/lib/supabase/server";
import type { CategoryCount, FeedItem, FeedResponse, Platform, TimeWindow } from "@/types";

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

function countCategories(items: FeedItem[]): CategoryCount[] {
  const counts = new Map<string, number>();
  for (const i of items) {
    const c = i.market.category;
    if (!c) continue;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const windowParam = (url.searchParams.get("window") ?? "15m") as TimeWindow;
  const window: TimeWindow = VALID_WINDOWS.includes(windowParam) ? windowParam : "15m";
  const platform = (url.searchParams.get("platform") ?? "all") as Platform | "all";
  const minDelta = Number(url.searchParams.get("minDelta") ?? "5") / 100;
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const category = url.searchParams.get("category") ?? null;

  const baseItems = (await getCachedFeed(window)) ?? (await fallbackFeed(window));

  // categories reflect the window's full set, before search/category filters,
  // so the badge bar doesn't shrink when a category is selected
  const baseCategories = countCategories(baseItems);

  let items = baseItems;
  if (platform !== "all") items = items.filter((i) => i.market.platform === platform);
  if (minDelta > 0) items = items.filter((i) => Math.abs(i.move.delta) >= minDelta);
  if (q) items = items.filter((i) => i.market.title.toLowerCase().includes(q));
  if (category) items = items.filter((i) => i.market.category === category);

  const body: FeedResponse = {
    window,
    count: items.length,
    categories: baseCategories,
    items,
  };
  return NextResponse.json(body);
}
