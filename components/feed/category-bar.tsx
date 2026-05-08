"use client";

import { cn } from "@/lib/utils";
import type { CategoryCount } from "@/types";

interface Props {
  categories: CategoryCount[];
  selected: string | null;
  onSelect: (next: string | null) => void;
}

export function CategoryBar({ categories, selected, onSelect }: Props) {
  const total = categories.reduce((acc, c) => acc + c.count, 0);
  return (
    <div className="-mx-1 flex flex-wrap items-center gap-1.5 px-1">
      <Pill label="All" count={total} active={selected === null} onClick={() => onSelect(null)} />
      {categories.map((c) => (
        <Pill
          key={c.name}
          label={c.name}
          count={c.count}
          active={selected === c.name}
          onClick={() => onSelect(selected === c.name ? null : c.name)}
        />
      ))}
    </div>
  );
}

function Pill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-foreground/20 bg-foreground/15 text-foreground"
          : "border-border/60 bg-card/40 text-muted-foreground hover:border-foreground/15 hover:text-foreground",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "tabular-nums text-[10px] font-mono",
          active ? "text-foreground/70" : "text-muted-foreground/70",
        )}
      >
        {count}
      </span>
    </button>
  );
}
