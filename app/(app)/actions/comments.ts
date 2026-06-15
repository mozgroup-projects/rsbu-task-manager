"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { logActivity } from "@/lib/activity";

const schema = z.object({
  taskId: z.string().min(1),
  body: z.string().trim().min(1, "Введите комментарий"),
});

export async function addComment(input: unknown) {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Не авторизован" };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message };
  }
  const { taskId, body } = parsed.data;

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return { ok: false, error: "Задача не найдена" };

  await prisma.comment.create({
    data: { taskId, authorId: userId, body },
  });
  await logActivity({ taskId, actorId: userId, action: "commented" });

  revalidatePath(`/tasks/${taskId}`);
  return { ok: true };
}

export async function deleteComment(commentId: string) {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Не авторизован" };

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.authorId !== userId) {
    return { ok: false, error: "Комментарий не найден" };
  }
  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/tasks/${comment.taskId}`);
  return { ok: true };
}
