import type { NormalizedMarket } from "./types";

interface GammaMarket {
  id: string;
  question: string;
  slug: string;
  outcomes?: string;
  outcomePrices?: string;
  liquidity?: string | number;
  volume?: string | number;
  category?: string;
  endDate?: string;
  active?: boolean;
  closed?: boolean;
}

const GAMMA_URL =
  "https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=500&order=volume24hr&ascending=false";

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

export async function fetchPolymarket(): Promise<NormalizedMarket[]> {
  const res = await fetch(GAMMA_URL, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Polymarket gamma ${res.status}`);
  const raw = (await res.json()) as GammaMarket[];

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

    out.push({
      id: `polymarket:${m.id}`,
      platform: "polymarket",
      native_id: m.id,
      title: m.question,
      url: `https://polymarket.com/market/${m.slug}`,
      category: m.category ?? null,
      liquidity: num(m.liquidity),
      volume: num(m.volume),
      probability,
      closes_at: m.endDate ?? null,
    });
  }
  return out;
}
