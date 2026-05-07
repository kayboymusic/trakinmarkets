const RECENCY_HALFLIFE_MIN = 30;

export function liquidityWeight(liquidity: number | null): number {
  return Math.log10((liquidity ?? 0) + 10);
}

export function recencyWeight(detectedAt: string | Date): number {
  const t = typeof detectedAt === "string" ? new Date(detectedAt) : detectedAt;
  const ageMin = Math.max(0, (Date.now() - t.getTime()) / 60_000);
  return Math.pow(0.5, ageMin / RECENCY_HALFLIFE_MIN);
}

export function score(delta: number, liquidity: number | null, detectedAt: string | Date): number {
  return Math.abs(delta) * liquidityWeight(liquidity) * recencyWeight(detectedAt);
}
