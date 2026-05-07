import type { TimeWindow } from "@/types";

export const WINDOW_MINUTES: Record<TimeWindow, number> = {
  "15m": 15,
  "1h": 60,
  "4h": 240,
};

export const MIN_DELTA = 0.05;

export function deltaOf(probFrom: number, probTo: number): number {
  return probTo - probFrom;
}

export function isSignificant(delta: number, liquidity: number | null): boolean {
  const minLiq = Number(process.env.MIN_LIQUIDITY ?? 5000);
  if (Math.abs(delta) < MIN_DELTA) return false;
  if ((liquidity ?? 0) < minLiq) return false;
  return true;
}
