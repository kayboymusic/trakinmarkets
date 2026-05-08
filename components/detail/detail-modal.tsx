"use client";

import { useState } from "react";
import useSWR from "swr";
import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { AttributionEvent, FeedItem, Market, SparklinePoint } from "@/types";
import { fmtPct, fmtCompact } from "@/lib/format";
import { DeltaPill } from "@/components/feed/delta-pill";
import { PlatformBadge } from "@/components/feed/platform-badge";
import { ProbabilityChart } from "./probability-chart";
import { Timeline } from "./timeline";

interface DetailResponse {
  market: Market;
  snapshots: SparklinePoint[];
  attribution: AttributionEvent[];
}

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json() as Promise<DetailResponse>;
};

interface Props {
  item: FeedItem | null;
  onClose: () => void;
}

export function DetailModal({ item, onClose }: Props) {
  const { data, isLoading } = useSWR<DetailResponse>(
    item ? `/api/markets/${encodeURIComponent(item.market.id)}` : null,
    fetcher,
  );

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        {item && (
          <>
            <DialogHeader>
              <div className="flex items-start gap-3">
                <MarketThumb url={item.market.image_url} alt={item.market.title} />
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <PlatformBadge platform={item.market.platform} />
                    <span className="text-xs text-muted-foreground">
                      {item.market.liquidity != null ? `${fmtCompact(item.market.liquidity)} liq` : ""}
                    </span>
                  </div>
                  <DialogTitle className="text-lg leading-snug">{item.market.title}</DialogTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-sm tabular-nums text-muted-foreground">
                    <span>{fmtPct(item.move.prob_from)}</span>
                    <span>→</span>
                    <span className="text-foreground">{fmtPct(item.move.prob_to)}</span>
                    <DeltaPill delta={item.move.delta} className="ml-1" />
                    <span className="text-xs">over {item.move.window}</span>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="mt-2">
              {isLoading || !data ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <ProbabilityChart points={data.snapshots} />
              )}
            </div>

            <Separator />

            <div>
              <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Why this might have moved
              </h4>
              {isLoading || !data ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : (
                <Timeline events={data.attribution} />
              )}
            </div>

            <div className="mt-2 flex justify-end">
              <a
                href={item.market.url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "secondary", size: "sm" })}
              >
                <ExternalLink className="size-3.5" />
                Open on {item.market.platform}
              </a>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MarketThumb({ url, alt }: { url: string | null; alt: string }) {
  const [errored, setErrored] = useState(false);
  if (!url || errored) {
    return (
      <div
        aria-hidden
        className="size-14 shrink-0 rounded-lg border border-border/60 bg-card/40"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setErrored(true)}
      className="size-14 shrink-0 rounded-lg border border-border/60 bg-muted object-cover"
    />
  );
}
