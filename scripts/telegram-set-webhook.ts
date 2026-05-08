/* eslint-disable no-console */
// Usage:
//   TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... APP_URL=https://... \
//     npx tsx scripts/telegram-set-webhook.ts

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const appUrl = process.env.APP_URL;

if (!token || !secret || !appUrl) {
  console.error(
    "Missing env vars. Set TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, APP_URL",
  );
  process.exit(1);
}

const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/telegram/webhook`;

async function main() {
  const set = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secret,
      allowed_updates: ["message", "edited_message"],
      drop_pending_updates: true,
    }),
  }).then((r) => r.json());
  console.log("setWebhook:", set);

  const info = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`).then(
    (r) => r.json(),
  );
  console.log("getWebhookInfo:", info);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
