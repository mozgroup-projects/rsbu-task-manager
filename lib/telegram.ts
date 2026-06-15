const TELEGRAM_API = "https://api.telegram.org";

function token(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN ?? null;
}

export function isTelegramConfigured(): boolean {
  return Boolean(token());
}

/**
 * Send a Telegram message. Returns true on success, false otherwise.
 * Uses the raw Bot API over fetch so it works in serverless/edge runtimes.
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
): Promise<boolean> {
  const botToken = token();
  if (!botToken) {
    console.warn("TELEGRAM_BOT_TOKEN is not set — skipping message");
    return false;
  }
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      console.error("Telegram sendMessage failed:", await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("Telegram sendMessage error:", err);
    return false;
  }
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
