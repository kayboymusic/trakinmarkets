"use client";

import { useState } from "react";
import useSWR from "swr";
import { FeedCard } from "./feed-card";
import { FeedFilters, type FilterState } from "./feed-filters";
import { SearchInput } from "./search-input";
import { CategoryBar } from "./category-bar";
import { DetailModal } from "@/components/detail/detail-modal";
import { Skeleton } from "@/components/ui/skeleton";
import type { FeedItem, FeedResponse } from "@/types";

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json() as Promise<FeedResponse>;
};

function buildUrl(filters: FilterState) {
  const params = new URLSearchParams({
    window: filters.window,
    platform: filters.platform,
    minDelta: String(filters.minDelta),
  });
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  return `/api/feed?${params.toString()}`;
}

export function FeedList() {
  const [filters, setFilters] = useState<FilterState>({
    window: "15m",
    platform: "all",
    minDelta: 5,
    q: "",
    category: null,
  });
  const [active, setActive] = useState<FeedItem | null>(null);

  const { data, error, isLoading } = useSWR<FeedResponse>(buildUrl(filters), fetcher, {
    refreshInterval: 15_000,
    revalidateOnFocus: true,
    keepPreviousData: true,
  });

  const hasActiveFilters = filters.q.length > 0 || filters.category !== null;
  const clearSearchAndCategory = () =>
    setFilters((f) => ({ ...f, q: "", category: null }));

  return (
    <>
      <div className="sticky top-0 z-10 mb-6 space-y-3 border-b border-border/60 bg-background/80 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <FeedFilters state={filters} onChange={setFilters} />
        <SearchInput
          value={filters.q}
          onChange={(q) => setFilters((f) => ({ ...f, q }))}
        />
        <CategoryBar
          categories={data?.categories ?? []}
          selected={filters.category}
          onSelect={(category) => setFilters((f) => ({ ...f, category }))}
        />
      </div>

      {error ? (
        <EmptyState
          title="Couldn't load feed"
          hint="The cron jobs may not have run yet, or Supabase isn't configured."
        />
      ) : isLoading && !data ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[110px] w-full" />
          ))}
        </div>
      ) : data && data.items.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? "No matches" : "No movers in this window"}
          hint={
            hasActiveFilters
              ? "Try clearing the search or category filter."
              : `Try a different time window (${filters.window === "15m" ? "1h or 4h" : filters.window === "1h" ? "15m or 4h" : "15m or 1h"}) or lower the min movement.`
          }
          action={hasActiveFilters ? { label: "Clear filters", onClick: clearSearchAndCategory } : undefined}
        />
      ) : (
        <div className="space-y-2.5">
          {data?.items.map((item) => (
            <FeedCard key={item.market.id} item={item} onSeeWhy={setActive} />
          ))}
        </div>
      )}

      <DetailModal item={active} onClose={() => setActive(null)} />
    </>
  );
}

function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 px-6 py-12 text-center">
      <div className="text-sm font-medium text-foreground">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 inline-flex items-center rounded-md border border-border/60 bg-card/40 px-3 py-1 text-xs text-foreground transition-colors hover:bg-card/60"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
