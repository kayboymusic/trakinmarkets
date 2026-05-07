import { format } from "date-fns";
import type { AttributionEvent } from "@/types";

export function Timeline({ events }: { events: AttributionEvent[] }) {
  if (!events?.length) {
    return <div className="text-sm text-muted-foreground">No signals attributed yet.</div>;
  }
  return (
    <ol className="relative ml-3 space-y-3 border-l border-border/60 pl-4">
      {events.map((e, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-foreground/40 ring-2 ring-background" />
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <span className="font-medium">{e.source}</span>
              <span>·</span>
              <time>{format(new Date(e.ts), "HH:mm")}</time>
            </div>
            <div className="text-sm text-foreground">{e.headline}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
