"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";

const createSchema = z.object({
  name: z.string().trim().min(1, "Введите название тега"),
  color: z.string().trim().default("#2463EB"),
});

export async function createTag(input: unknown) {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Не авторизован" };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message };
  }
  const { name, color } = parsed.data;

  const existing = await prisma.tag.findUnique({
    where: { ownerId_name: { ownerId: userId, name } },
  });
  if (existing) return { ok: false, error: "Такой тег уже есть" };

  const tag = await prisma.tag.create({
    data: { name, color, ownerId: userId },
  });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true, id: tag.id };
}

export async function deleteTag(tagId: string) {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Не авторизован" };

  const tag = await prisma.tag.findUnique({ where: { id: tagId } });
  if (!tag || tag.ownerId !== userId) {
    return { ok: false, error: "Тег не найден" };
  }
  await prisma.tag.delete({ where: { id: tagId } });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}
