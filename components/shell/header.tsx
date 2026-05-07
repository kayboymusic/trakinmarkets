import { Activity } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-border/60">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-foreground/10 ring-1 ring-inset ring-foreground/15">
            <Activity className="size-3.5 text-foreground" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">trakin</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Belief Intelligence
            </div>
          </div>
        </div>
        <div className="hidden text-xs text-muted-foreground sm:block">
          See what the world just started believing — and why.
        </div>
      </div>
    </header>
  );
}
