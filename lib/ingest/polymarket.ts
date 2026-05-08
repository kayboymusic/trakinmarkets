import type { NormalizedMarket } from "./types";
import { pickCategory } from "./categories";

interface GammaTag {
  label?: string;
}

interface GammaEventRef {
  id?: string;
}

interface GammaMarket {
  id: string;
  question: string;
  slug: string;
  outcomes?: string;
  outcomePrices?: string;
  liquidity?: string | number;
  volume?: string | number;
  endDate?: string;
  active?: boolean;
  closed?: boolean;
  events?: GammaEventRef[];
}

interface GammaEvent {
  id: string;
  tags?: GammaTag[];
}

const MARKETS_URL =
  "https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=500&order=volume24hr&ascending=false";
const EVENTS_URL =
  "https://gamma-api.polymarket.com/events?active=true&closed=false&limit=200&order=volume24hr&ascending=false";

const num = (v: unknown): number | null => {
  if (v == null) return null;
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : null;
};

const parseList = (s: string | undefined): string[] => {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
};

async function fetchEventCategoryMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const res = await fetch(EVENTS_URL, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return map;
    const events = (await res.json()) as GammaEvent[];
    for (const e of events) {
      const cat = pickCategory(e.tags);
      if (cat && e.id) map.set(String(e.id), cat);
    }
  } catch (err) {
    console.warn("[polymarket] events fetch failed:", err);
  }
  return map;
}

export async function fetchPolymarket(): Promise<NormalizedMarket[]> {
  const [marketsRes, categoryByEvent] = await Promise.all([
    fetch(MARKETS_URL, { headers: { accept: "application/json" }, cache: "no-store" }),
    fetchEventCategoryMap(),
  ]);
  if (!marketsRes.ok) throw new Error(`Polymarket gamma ${marketsRes.status}`);
  const raw = (await marketsRes.json()) as GammaMarket[];

  const out: NormalizedMarket[] = [];
  for (const m of raw) {
    const outcomes = parseList(m.outcomes);
    const prices = parseList(m.outcomePrices).map(Number);
    if (outcomes.length !== 2 || prices.length !== 2) continue;
    const yesIdx = outcomes.findIndex(
      (o) => o.toLowerCase() === "yes" || o.toLowerCase() === "true",
    );
    const probability = yesIdx >= 0 ? prices[yesIdx] : prices[0];
    if (!Number.isFinite(probability)) continue;

    const eventId = m.events?.[0]?.id ? String(m.events[0].id) : null;
    const category = eventId ? (categoryByEvent.get(eventId) ?? null) : null;

    out.push({
      id: `polymarket:${m.id}`,
      platform: "polymarket",
      native_id: m.id,
      title: m.question,
      url: `https://polymarket.com/market/${m.slug}`,
      category,
      liquidity: num(m.liquidity),
      volume: num(m.volume),
      probability,
      closes_at: m.endDate ?? null,
    });
  }
  return out;
}
