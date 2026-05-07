"use client";

import { useState } from "react";
import useSWR from "swr";
import { FeedCard } from "./feed-card";
import { FeedFilters, type FilterState } from "./feed-filters";
import { DetailModal } from "@/components/detail/detail-modal";
import { Skeleton } from "@/components/ui/skeleton";
import type { FeedItem } from "@/types";

interface FeedResponse {
  window: string;
  count: number;
  items: FeedItem[];
}

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json() as Promise<FeedResponse>;
};

export function FeedList() {
  const [filters, setFilters] = useState<FilterState>({
    window: "15m",
    platform: "all",
    minDelta: 5,
  });
  const [active, setActive] = useState<FeedItem | null>(null);

  const url = `/api/feed?window=${filters.window}&platform=${filters.platform}&minDelta=${filters.minDelta}`;
  const { data, error, isLoading } = useSWR<FeedResponse>(url, fetcher, {
    refreshInterval: 15_000,
    revalidateOnFocus: true,
    keepPreviousData: true,
  });

  return (
    <>
      <div className="sticky top-0 z-10 mb-6 border-b border-border/60 bg-background/80 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <FeedFilters state={filters} onChange={setFilters} />
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
          title="No movers in this window"
          hint={`Try a different time window (${filters.window === "15m" ? "1h or 4h" : filters.window === "1h" ? "15m or 4h" : "15m or 1h"}) or lower the min movement.`}
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

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 px-6 py-12 text-center">
      <div className="text-sm font-medium text-foreground">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}
