import type { FeedItem } from "@/types";
import { fmtPct, fmtDelta, fmtCompact } from "@/lib/format";

const API = (token: string, method: string) =>
  `https://api.telegram.org/bot${token}/${method}`;

export function hasTelegram(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

const PLATFORM_LABEL: Record<string, string> = {
  polymarket: "Polymarket",
  kalshi: "Kalshi",
  bayse: "Bayse",
};

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function formatAlert(item: FeedItem): string {
  const { market, move } = item;
  const positive = move.delta >= 0;
  const arrow = positive ? "🟢" : "🔴";
  const platform = PLATFORM_LABEL[market.platform] ?? market.platform;
  const liq = market.liquidity != null ? ` · ${fmtCompact(market.liquidity)} liq` : "";

  return [
    `${arrow} <b>${fmtDelta(move.delta)}</b> · ${platform} · ${move.window}`,
    `<a href="${escape(market.url)}">${escape(market.title)}</a>`,
    `${fmtPct(move.prob_from)} → <b>${fmtPct(move.prob_to)}</b>${liq}`,
  ].join("\n");
}

interface SendResult {
  ok: boolean;
  status?: number;
  error?: string;
  /** Telegram tells us to back off; in seconds */
  retryAfter?: number;
}

export async function sendMessage(chatId: number, text: string): Promise<SendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN not set" };
  try {
    const res = await fetch(API(token, "sendMessage"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as {
        description?: string;
        parameters?: { retry_after?: number };
      };
      return {
        ok: false,
        status: res.status,
        error: body.description ?? res.statusText,
        retryAfter: body.parameters?.retry_after,
      };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/** Sequentially DM each chatId with a small delay to stay under Telegram's 30/sec limit. */
export async function broadcast(
  chatIds: number[],
  text: string,
  delayMs = 50,
): Promise<{ sent: number; failed: number; deactivated: number[] }> {
  let sent = 0;
  let failed = 0;
  const deactivated: number[] = [];
  for (const id of chatIds) {
    const r = await sendMessage(id, text);
    if (r.ok) {
      sent++;
    } else {
      failed++;
      // Common terminal errors that mean "stop trying this chat"
      // https://core.telegram.org/api/errors
      if (
        r.status === 403 ||
        r.error?.includes("bot was blocked") ||
        r.error?.includes("user is deactivated") ||
        r.error?.includes("chat not found")
      ) {
        deactivated.push(id);
      }
      if (r.retryAfter) {
        await new Promise((res) => setTimeout(res, r.retryAfter! * 1000));
      }
    }
    if (delayMs) await new Promise((res) => setTimeout(res, delayMs));
  }
  return { sent, failed, deactivated };
}
