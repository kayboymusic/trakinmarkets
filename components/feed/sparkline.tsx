"use client";

import type { SparklinePoint } from "@/types";

interface Props {
  points: SparklinePoint[];
  width?: number;
  height?: number;
  positive?: boolean;
  className?: string;
}

export function Sparkline({ points, width = 96, height = 32, positive, className }: Props) {
  if (!points || points.length < 2) {
    return <div style={{ width, height }} className={className} aria-hidden />;
  }
  const xs = points.map((_, i) => i);
  const ys = points.map((p) => p.probability);
  const xMin = 0;
  const xMax = xs.length - 1 || 1;
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const yRange = Math.max(yMax - yMin, 0.01);

  const sx = (x: number) => ((x - xMin) / (xMax - xMin)) * (width - 2) + 1;
  const sy = (y: number) => height - 1 - ((y - yMin) / yRange) * (height - 2);

  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${sx(i).toFixed(2)},${sy(p.probability).toFixed(2)}`)
    .join(" ");
  const areaD = `${d} L${sx(points.length - 1).toFixed(2)},${(height - 1).toFixed(2)} L${sx(0).toFixed(2)},${(height - 1).toFixed(2)} Z`;

  const stroke = positive ? "var(--chart-pos)" : "var(--chart-neg)";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={`sg-${positive ? "p" : "n"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#sg-${positive ? "p" : "n"})`} />
      <path d={d} stroke={stroke} strokeWidth={1.25} fill="none" />
    </svg>
  );
}
