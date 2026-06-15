import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";

/**
 * Telegram webhook. Handles the /start <code> linking flow:
 * a user copies their code from Settings and sends it to the bot,
 * which binds their chat id to the account.
 */
export async function POST(req: Request) {
  // Optional shared-secret check (set via setWebhook secret_token).
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const header = req.headers.get("x-telegram-bot-api-secret-token");
    if (header !== secret) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  let update: any;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const message = update?.message;
  const chatId: string | undefined = message?.chat?.id?.toString();
  const text: string | undefined = message?.text;

  if (!chatId || !text) {
    return NextResponse.json({ ok: true });
  }

  if (text.startsWith("/start")) {
    const parts = text.trim().split(/\s+/);
    const code = parts[1];

    if (!code) {
      await sendTelegramMessage(
        chatId,
        "Привет! Чтобы получать напоминания, скопируйте код из раздела «Настройки» в RSBU Task Manager и отправьте команду вида:\n<code>/start ВАШКОД</code>",
      );
      return NextResponse.json({ ok: true });
    }

    const user = await prisma.user.findUnique({
      where: { telegramLinkCode: code.toUpperCase() },
    });
    if (!user) {
      await sendTelegramMessage(
        chatId,
        "Код не найден. Проверьте код в разделе «Настройки» и попробуйте снова.",
      );
      return NextResponse.json({ ok: true });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { telegramChatId: chatId },
    });
    await sendTelegramMessage(
      chatId,
      `Готово, ${user.name}! Теперь вы будете получать ежедневный дайджест задач. ✅`,
    );
    return NextResponse.json({ ok: true });
  }

  await sendTelegramMessage(
    chatId,
    "Я отправляю напоминания по задачам RSBU Task Manager. Управляйте задачами в приложении.",
  );
  return NextResponse.json({ ok: true });
}
