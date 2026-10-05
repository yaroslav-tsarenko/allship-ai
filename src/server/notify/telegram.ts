import "server-only";
import { env } from "@/env";
import { log } from "@/lib/log";

export async function notifyAdmins(text: string) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_ADMIN_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: env.TELEGRAM_ADMIN_CHAT_ID, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    log.warn("telegram notify failed", { scope: "telegram", err: error });
  }
}
