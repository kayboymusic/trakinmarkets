import { createHmac } from "node:crypto";
import type { NormalizedMarket } from "./types";

const BASE = "https://relay.bayse.markets";

function sign(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

interface BayseMarketRaw {
  id?: string;
  market_id?: string;
  question?: string;
  title?: string;
  slug?: string;
  url?: string;
  yes_price?: number;
  probability?: number;
  liquidity?: number;
  volume?: number;
  category?: string;
  closes_at?: string;
  end_date?: string;
}

export async function fetchBayse(): Promise<NormalizedMarket[]> {
  const apiKey = process.env.BAYSE_API_KEY;
  const apiSecret = process.env.BAYSE_API_SECRET;
  if (!apiKey || !apiSecret) {
    console.log("[bayse] skipped: missing credentials");
    return [];
  }

  const path = "/v1/markets";
  const ts = Date.now().toString();
  const payload = `${ts}GET${path}`;
  const signature = sign(apiSecret, payload);

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "X-API-Key": apiKey,
      "X-Timestamp": ts,
      "X-Signature": signature,
      accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    console.warn(`[bayse] ${res.status} ${res.statusText} — verify endpoint at docs.bayse.markets`);
    return [];
  }
  const json = (await res.json()) as { data?: BayseMarketRaw[] } | BayseMarketRaw[];
  const list = Array.isArray(json) ? json : (json.data ?? []);

  const out: NormalizedMarket[] = [];
  for (const m of list) {
    const nativeId = m.id ?? m.market_id;
    const probability = m.probability ?? m.yes_price ?? null;
    const title = m.title ?? m.question;
    if (!nativeId || !title || probability == null) continue;
    out.push({
      id: `bayse:${nativeId}`,
      platform: "bayse",
      native_id: nativeId,
      title,
      url: m.url ?? `https://www.bayse.markets/market/${m.slug ?? nativeId}`,
      category: m.category ?? null,
      liquidity: m.liquidity ?? null,
      volume: m.volume ?? null,
      probability,
      closes_at: m.closes_at ?? m.end_date ?? null,
    });
  }
  return out;
}
