"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import type { SparklinePoint } from "@/types";

export function ProbabilityChart({ points }: { points: SparklinePoint[] }) {
  const data = points.map((p) => ({
    ts: new Date(p.ts).getTime(),
    prob: p.probability * 100,
  }));

  if (data.length < 2) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Not enough data yet
      </div>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="probGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.7 0.18 200)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="oklch(0.7 0.18 200)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="ts"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(t) => format(new Date(t), "HH:mm")}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            stroke="var(--border)"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            stroke="var(--border)"
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(t) => format(new Date(t as number), "MMM d, HH:mm")}
            formatter={(v) => [`${Number(v).toFixed(1)}%`, "Probability"]}
          />
          <Area
            type="monotone"
            dataKey="prob"
            stroke="oklch(0.78 0.16 200)"
            strokeWidth={1.5}
            fill="url(#probGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
