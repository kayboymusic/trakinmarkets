import type { Platform, TimeWindow } from "@/types";

export const WINDOW_MINUTES: Record<TimeWindow, number> = {
  "15m": 15,
  "1h": 60,
  "4h": 240,
};

// Per-window detection thresholds. Shorter windows need looser cuts because
// most markets don't shift 5pp in 15 minutes — and the markets that do tend
// to be thinner.
export const THRESHOLDS: Record<TimeWindow, { minDelta: number; minLiquidity: number }> = {
  "15m": { minDelta: 0.03, minLiquidity: 1000 },
  "1h": { minDelta: 0.05, minLiquidity: 5000 },
  "4h": { minDelta: 0.05, minLiquidity: 5000 },
};

// Kalshi reports far smaller liquidity numbers than Polymarket and most
// non-sports markets sit under $5k. Lower the floor so they can surface;
// the delta cut still keeps noise out.
const PLATFORM_MIN_LIQUIDITY: Partial<Record<Platform, Partial<Record<TimeWindow, number>>>> = {
  kalshi: { "15m": 500, "1h": 1000, "4h": 1000 },
};

export function deltaOf(probFrom: number, probTo: number): number {
  return probTo - probFrom;
}

export function isSignificant(
  window: TimeWindow,
  delta: number,
  liquidity: number | null,
  platform?: Platform,
): boolean {
  const t = THRESHOLDS[window];
  const minLiq = (platform && PLATFORM_MIN_LIQUIDITY[platform]?.[window]) ?? t.minLiquidity;
  if (Math.abs(delta) < t.minDelta) return false;
  if ((liquidity ?? 0) < minLiq) return false;
  return true;
}
