import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage, escapeHtml, isTelegramConfigured } from "@/lib/telegram";
import { PRIORITY_LABELS } from "@/lib/constants";
import { formatDue } from "@/lib/format";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // allow in local dev when unset
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/**
 * Daily digest cron (run once per day via Vercel Cron).
 * Sends each Telegram-linked user a summary of tasks due today,
 * overdue tasks, and recurring daily tasks.
 */
async function runDigest() {
  if (!isTelegramConfigured()) {
    return { sent: 0, skipped: "telegram-not-configured" };
  }

  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const users = await prisma.user.findMany({
    where: { telegramChatId: { not: null } },
  });

  let sent = 0;
  for (const user of users) {
    const tasks = await prisma.task.findMany({
      where: {
        ownerId: user.id,
        remindersEnabled: true,
        status: { not: "done" },
        OR: [
          { dueAt: { lte: endOfToday } }, // due today or overdue
          { recurrence: "daily" },
        ],
      },
      orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }],
    });

    if (tasks.length === 0) continue;

    const overdue = tasks.filter((t) => t.dueAt && t.dueAt < startOfToday);
    const today = tasks.filter(
      (t) => t.dueAt && t.dueAt >= startOfToday && t.dueAt <= endOfToday,
    );
    const recurring = tasks.filter((t) => t.recurrence === "daily" && !t.dueAt);

    const lines: string[] = [`<b>📋 Задачи на сегодня</b>`];

    if (overdue.length) {
      lines.push("", "<b>⚠️ Просрочено:</b>");
      for (const t of overdue) {
        lines.push(
          `• ${escapeHtml(t.title)} — ${formatDue(t.dueAt!).label} [${PRIORITY_LABELS[t.priority]}]`,
        );
      }
    }
    if (today.length) {
      lines.push("", "<b>📅 Сегодня:</b>");
      for (const t of today) {
        lines.push(
          `• ${escapeHtml(t.title)} — ${formatDue(t.dueAt!).label} [${PRIORITY_LABELS[t.priority]}]`,
        );
      }
    }
    if (recurring.length) {
      lines.push("", "<b>🔁 Ежедневные:</b>");
      for (const t of recurring) {
        lines.push(`• ${escapeHtml(t.title)} [${PRIORITY_LABELS[t.priority]}]`);
      }
    }

    const ok = await sendTelegramMessage(user.telegramChatId!, lines.join("\n"));
    if (ok) {
      sent++;
      await prisma.activityLog.createMany({
        data: tasks.map((t) => ({
          taskId: t.id,
          actorId: user.id,
          action: "reminder_sent" as const,
        })),
      });
    }
  }

  return { sent, users: users.length };
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runDigest();
  return NextResponse.json({ ok: true, ...result });
}
