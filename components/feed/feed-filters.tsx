"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Slider } from "@/components/ui/slider";
import type { TimeWindow } from "@/types";

export type PlatformFilter = "all" | "polymarket" | "bayse";

export interface FilterState {
  window: TimeWindow;
  platform: PlatformFilter;
  minDelta: number;
  q: string;
  category: string | null;
}

interface Props {
  state: FilterState;
  onChange: (next: FilterState) => void;
}

export function FeedFilters({ state, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ToggleGroup
        value={[state.window]}
        onValueChange={(values) => {
          const v = values[0];
          if (v) onChange({ ...state, window: v as TimeWindow });
        }}
        className="rounded-md border border-border/60 bg-card/40 p-0.5"
      >
        <ToggleGroupItem
          value="15m"
          className="h-7 px-2.5 text-xs font-mono data-[pressed]:bg-foreground/10 data-[pressed]:text-foreground"
        >
          15m
        </ToggleGroupItem>
        <ToggleGroupItem
          value="1h"
          className="h-7 px-2.5 text-xs font-mono data-[pressed]:bg-foreground/10 data-[pressed]:text-foreground"
        >
          1h
        </ToggleGroupItem>
        <ToggleGroupItem
          value="4h"
          className="h-7 px-2.5 text-xs font-mono data-[pressed]:bg-foreground/10 data-[pressed]:text-foreground"
        >
          4h
        </ToggleGroupItem>
      </ToggleGroup>

      <Select
        value={state.platform}
        onValueChange={(v) => onChange({ ...state, platform: v as PlatformFilter })}
      >
        <SelectTrigger className="h-8 w-[140px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All platforms</SelectItem>
          <SelectItem value="polymarket">Polymarket</SelectItem>
          <SelectItem value="bayse">Bayse</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2 rounded-md border border-border/60 bg-card/40 px-3 py-1">
        <span className="text-xs text-muted-foreground">min</span>
        <Slider
          value={[state.minDelta]}
          min={5}
          max={25}
          step={1}
          onValueChange={(v) => {
            const next = Array.isArray(v) ? v[0] : v;
            if (typeof next === "number") onChange({ ...state, minDelta: next });
          }}
          className="w-24"
        />
        <span className="font-mono text-xs tabular-nums text-foreground w-7">{state.minDelta}%</span>
      </div>
    </div>
  );
}
