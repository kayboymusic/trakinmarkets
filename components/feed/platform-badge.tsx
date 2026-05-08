import { Badge } from "@/components/ui/badge";
import type { Platform } from "@/types";

const labels: Record<Platform, string> = {
  polymarket: "Polymarket",
  bayse: "Bayse",
  kalshi: "Kalshi",
};

export function PlatformBadge({ platform }: { platform: Platform }) {
  return (
    <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-medium">
      {labels[platform] ?? platform}
    </Badge>
  );
}
