"use client";

import { useState } from "react";
import { ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import type { FeedItem } from "@/types";
import { fmtPct, fmtCompact, relTime } from "@/lib/format";
import { DeltaPill } from "./delta-pill";
import { PlatformBadge } from "./platform-badge";
import { Sparkline } from "./sparkline";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Props {
  item: FeedItem;
  onSeeWhy: (item: FeedItem) => void;
}

export function FeedCard({ item, onSeeWhy }: Props) {
  const { market, move, sparkline } = item;
  const positive = move.delta >= 0;

  return (
    <Card className="group p-4 transition-colors hover:bg-card/60">
      <div className="flex items-start gap-4">
        <MarketThumb url={market.image_url} alt={market.title} />
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <PlatformBadge platform={market.platform} />
            <span className="font-mono">{move.window}</span>
            <span>·</span>
            <span>{relTime(move.detected_at)}</span>
            {market.liquidity != null && (
              <>
                <span>·</span>
                <span>{fmtCompact(market.liquidity)} liq</span>
              </>
            )}
          </div>
          <h3 className="line-clamp-2 text-base font-medium leading-snug text-foreground">
            {market.title}
          </h3>
          <div className="mt-3 flex items-center gap-2 font-mono text-sm tabular-nums text-muted-foreground">
            <span>{fmtPct(move.prob_from)}</span>
            <ArrowRight className="size-3.5" />
            <span className="text-foreground">{fmtPct(move.prob_to)}</span>
            <DeltaPill delta={move.delta} className="ml-1" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <Sparkline points={sparkline} positive={positive} width={104} height={36} />
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => onSeeWhy(item)}
            >
              <Sparkles className="size-3" />
              See why
            </Button>
            <a
              href={market.url}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "ghost", size: "sm" }) + " h-7 px-2 text-xs"}
            >
              <ExternalLink className="size-3" />
              View
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
}

function MarketThumb({ url, alt }: { url: string | null; alt: string }) {
  const [errored, setErrored] = useState(false);
  if (!url || errored) {
    return (
      <div
        aria-hidden
        className="size-11 shrink-0 rounded-md border border-border/60 bg-card/40"
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
      className="size-11 shrink-0 rounded-md border border-border/60 bg-muted object-cover"
    />
  );
}
