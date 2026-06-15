"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { generateLinkCode } from "@/lib/utils";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Укажите ФИО"),
  timezone: z.string().trim().min(1).default("Europe/Moscow"),
});

export async function updateProfile(input: unknown) {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Не авторизован" };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message };
  }
  await prisma.user.update({
    where: { id: userId },
    data: { name: parsed.data.name, timezone: parsed.data.timezone },
  });
  revalidatePath("/settings");
  return { ok: true };
}

/** Ensure the user has a Telegram link code, regenerating on request. */
export async function regenerateTelegramCode() {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Не авторизован" };
  const code = generateLinkCode();
  await prisma.user.update({
    where: { id: userId },
    data: { telegramLinkCode: code, telegramChatId: null },
  });
  revalidatePath("/settings");
  return { ok: true, code };
}

export async function disconnectTelegram() {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Не авторизован" };
  await prisma.user.update({
    where: { id: userId },
    data: { telegramChatId: null },
  });
  revalidatePath("/settings");
  return { ok: true };
}

export async function disconnectGoogleCalendar() {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Не авторизован" };
  await prisma.user.update({
    where: { id: userId },
    data: { googleRefreshToken: null },
  });
  revalidatePath("/settings");
  return { ok: true };
}
