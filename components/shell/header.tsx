import { Activity, Bell } from "lucide-react";

const TELEGRAM_BOT_URL = "https://t.me/trakinmarkets_bot";

export function Header() {
  return (
    <header className="border-b border-border/60">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-5">
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
        <a
          href={TELEGRAM_BOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-card/60 hover:text-foreground"
        >
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
          </span>
          <Bell className="size-3" />
          <span className="hidden sm:inline">Get alerts on Telegram</span>
          <span className="sm:hidden">Alerts</span>
        </a>
      </div>
    </header>
  );
}
