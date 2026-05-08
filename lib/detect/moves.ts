import type { TimeWindow } from "@/types";

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

export function deltaOf(probFrom: number, probTo: number): number {
  return probTo - probFrom;
}

export function isSignificant(
  window: TimeWindow,
  delta: number,
  liquidity: number | null,
): boolean {
  const t = THRESHOLDS[window];
  if (Math.abs(delta) < t.minDelta) return false;
  if ((liquidity ?? 0) < t.minLiquidity) return false;
  return true;
}
