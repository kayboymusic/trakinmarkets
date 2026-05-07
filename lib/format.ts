export const fmtPct = (p: number, digits?: number) => {
  const pct = p * 100;
  if (digits !== undefined) return `${pct.toFixed(digits)}%`;
  if (pct > 0 && pct < 0.1) return `${pct.toFixed(2)}%`;
  if (pct > 0 && pct < 1) return `${pct.toFixed(1)}%`;
  if (pct > 99 && pct < 100) return `${pct.toFixed(1)}%`;
  return `${Math.round(pct)}%`;
};

export const fmtDelta = (d: number) => {
  const sign = d > 0 ? "+" : "";
  return `${sign}${(d * 100).toFixed(1)}pp`;
};

export const fmtCompact = (n: number) => {
  if (n == null || Number.isNaN(n)) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Math.round(n)}`;
};

export function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}
