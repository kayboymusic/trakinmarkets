import { fmtDelta } from "@/lib/format";
import { cn } from "@/lib/utils";

export function DeltaPill({ delta, className }: { delta: number; className?: string }) {
  const positive = delta >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium font-mono tabular-nums",
        positive
          ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20"
          : "bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-500/20",
        className,
      )}
    >
      {fmtDelta(delta)}
    </span>
  );
}
