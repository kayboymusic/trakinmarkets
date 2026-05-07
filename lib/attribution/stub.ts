import type { AttributionEvent } from "@/types";

const SOURCES = ["Reuters", "Bloomberg", "X / @realtime", "WSJ", "FT", "AP"];
const HEADLINES = [
  "Insider sources confirm imminent announcement",
  "Polling data shows sharp shift in last 24h",
  "Key figure issues unexpected statement",
  "Leaked memo circulates among traders",
  "Volume spike on offshore desks",
  "Late-session order flow turns one-sided",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function stubAttribution(marketId: string, detectedAt: string): AttributionEvent[] {
  const seed = hash(marketId);
  const count = 2 + (seed % 3);
  const base = new Date(detectedAt).getTime();
  return Array.from({ length: count }).map((_, i) => {
    const src = SOURCES[(seed + i) % SOURCES.length];
    const head = HEADLINES[(seed * (i + 1)) % HEADLINES.length];
    const ts = new Date(base - i * (5 + (seed % 25)) * 60_000).toISOString();
    return { ts, source: src, headline: head };
  });
}
