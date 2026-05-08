import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { sendMessage } from "@/lib/notify/telegram";

export const dynamic = "force-dynamic";

interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  is_bot?: boolean;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: { id: number; type: string };
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
}

const WELCOME =
  "👋 You're subscribed to <b>trakin alerts</b>.\n\n" +
  "I'll DM you when a prediction market shifts by ≥10pp on a market with ≥$10k liquidity.\n\n" +
  "Commands:\n" +
  "/stop — pause alerts\n" +
  "/help — list commands\n\n" +
  "📊 https://trakinmarketsofc.vercel.app";

const STOPPED =
  "⏸️ Alerts paused. Send /start any time to resume.";

const HELP =
  "<b>Commands</b>\n" +
  "/start — subscribe (or resume after /stop)\n" +
  "/stop — pause alerts\n" +
  "/help — show this message";

export async function POST(req: Request) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret) {
    const got = req.headers.get("x-telegram-bot-api-secret-token");
    if (got !== expectedSecret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const update = (await req.json().catch(() => null)) as TelegramUpdate | null;
  if (!update) return NextResponse.json({ ok: true });

  const msg = update.message ?? update.edited_message;
  if (!msg?.text || !msg.chat || msg.chat.type !== "private" || msg.from?.is_bot) {
    return NextResponse.json({ ok: true });
  }

  const text = msg.text.trim();
  const chatId = msg.chat.id;
  const username = msg.from?.username ?? msg.from?.first_name ?? null;
  const db = supabaseServer();

  if (text.startsWith("/start")) {
    await db.from("subscribers").upsert(
      { chat_id: chatId, username, paused: false },
      { onConflict: "chat_id" },
    );
    await sendMessage(chatId, WELCOME);
  } else if (text.startsWith("/stop")) {
    await db
      .from("subscribers")
      .update({ paused: true })
      .eq("chat_id", chatId);
    await sendMessage(chatId, STOPPED);
  } else if (text.startsWith("/help")) {
    await sendMessage(chatId, HELP);
  }
  // ignore everything else silently

  return NextResponse.json({ ok: true });
}
