import type { NormalizedMarket } from "./types";

const BASE = "https://api.elections.kalshi.com/trade-api/v2";
const PAGE_LIMIT = 1000;
const MAX_PAGES = 10; // hard cap so a runaway cursor can't burn the 60s budget

interface KalshiEvent {
  event_ticker: string;
  series_ticker?: string;
  category?: string;
  title?: string;
}

interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  title?: string;
  yes_sub_title?: string;
  market_type?: string;
  status?: string;
  last_price_dollars?: number | string;
  yes_bid_dollars?: number | string;
  yes_ask_dollars?: number | string;
  liquidity_dollars?: number | string;
  volume_fp?: number | string;
  volume_24h_fp?: number | string;
  open_interest_fp?: number | string;
  close_time?: string;
  expiration_time?: string;
}

const num = (v: unknown): number => {
  if (v == null) return 0;
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
};

async function fetchPaginated<T>(
  resource: "events" | "markets",
  pluck: (page: { events?: KalshiEvent[]; markets?: KalshiMarket[] }) => T[],
): Promise<T[]> {
  const all: T[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < MAX_PAGES; i++) {
    const url = new URL(`${BASE}/${resource}`);
    url.searchParams.set("status", "open");
    url.searchParams.set("limit", String(PAGE_LIMIT));
    if (cursor) url.searchParams.set("cursor", cursor);
    const res = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store" });
    if (!res.ok) {
      console.warn(`[kalshi] ${resource} page ${i} ${res.status}`);
      break;
    }
    const data = (await res.json()) as {
      events?: KalshiEvent[];
      markets?: KalshiMarket[];
      cursor?: string;
    };
    const items = pluck(data);
    all.push(...items);
    if (!data.cursor || data.cursor === cursor || items.length === 0) break;
    cursor = data.cursor;
  }
  return all;
}

async function fetchEventCategoryMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const events = await fetchPaginated<KalshiEvent>("events", (p) => p.events ?? []);
    for (const e of events) {
      if (e.event_ticker && e.category) {
        map.set(e.event_ticker, e.category);
      }
    }
  } catch (err) {
    console.warn("[kalshi] events fetch failed:", err);
  }
  return map;
}

export async function fetchKalshi(): Promise<NormalizedMarket[]> {
  const [raw, categoryByEvent] = await Promise.all([
    fetchPaginated<KalshiMarket>("markets", (p) => p.markets ?? []),
    fetchEventCategoryMap(),
  ]);

  const out: NormalizedMarket[] = [];
  for (const m of raw) {
    if (m.market_type && m.market_type !== "binary") continue;

    const last = num(m.last_price_dollars);
    const bid = num(m.yes_bid_dollars);
    const ask = num(m.yes_ask_dollars);
    let probability: number | null = null;
    if (last > 0) probability = last;
    else if (bid > 0 && ask > 0) probability = (bid + ask) / 2;
    if (probability == null) continue;

    // liquidity_dollars is reported as 0 on most Kalshi markets; use lifetime
    // trading volume in dollars (volume_fp) as a "this market is real" proxy
    const liquidity = num(m.liquidity_dollars) || num(m.volume_fp);
    const volume = num(m.volume_24h_fp) || num(m.volume_fp);
    const category = categoryByEvent.get(m.event_ticker) ?? null;

    out.push({
      id: `kalshi:${m.ticker}`,
      platform: "kalshi",
      native_id: m.ticker,
      title: m.title ?? m.yes_sub_title ?? m.ticker,
      url: `https://kalshi.com/markets/${m.event_ticker}`,
      image_url: null,
      category,
      liquidity: liquidity || null,
      volume: volume || null,
      probability,
      closes_at: m.close_time ?? m.expiration_time ?? null,
    });
  }
  return out;
}
