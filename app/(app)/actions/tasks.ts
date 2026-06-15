"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { logActivity, logFieldChanges } from "@/lib/activity";
import {
  syncTaskToCalendar,
  deleteCalendarEvent,
  getUserRefreshToken,
} from "@/lib/google-calendar";
import {
  getSupabaseAdmin,
  isStorageConfigured,
  STORAGE_BUCKET,
} from "@/lib/supabase";

type ActionResult = { ok: boolean; error?: string; id?: string };

const taskSchema = z.object({
  title: z.string().trim().min(1, "Введите название"),
  description: z.string().trim().optional().nullable(),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueAt: z.string().optional().nullable(),
  recurrence: z.enum(["none", "daily", "weekly", "monthly"]).default("none"),
  remindersEnabled: z.boolean().default(true),
  tagIds: z.array(z.string()).default([]),
});

function parseDue(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export async function createTask(input: unknown): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Не авторизован" };

  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message };
  }
  const data = parsed.data;
  const dueAt = parseDue(data.dueAt);

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description || null,
      status: data.status,
      priority: data.priority,
      dueAt,
      recurrence: data.recurrence,
      remindersEnabled: data.remindersEnabled,
      completedAt: data.status === "done" ? new Date() : null,
      ownerId: userId,
      createdById: userId,
      tags: { create: data.tagIds.map((tagId) => ({ tagId })) },
      activity: { create: { actorId: userId, action: "created" } },
    },
  });

  if (dueAt) {
    const refresh = await getUserRefreshToken(userId);
    const eventId = await syncTaskToCalendar(task, refresh);
    if (eventId && eventId !== task.googleEventId) {
      await prisma.task.update({
        where: { id: task.id },
        data: { googleEventId: eventId },
      });
    }
  }

  revalidatePath("/dashboard");
  return { ok: true, id: task.id };
}

export async function updateTask(
  taskId: string,
  input: unknown,
): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Не авторизован" };

  const existing = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existing || existing.ownerId !== userId || existing.deletedAt) {
    return { ok: false, error: "Задача не найдена" };
  }

  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message };
  }
  const data = parsed.data;
  const dueAt = parseDue(data.dueAt);

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      title: data.title,
      description: data.description || null,
      status: data.status,
      priority: data.priority,
      dueAt,
      recurrence: data.recurrence,
      remindersEnabled: data.remindersEnabled,
      completedAt:
        data.status === "done"
          ? (existing.completedAt ?? new Date())
          : null,
      tags: {
        deleteMany: {},
        create: data.tagIds.map((tagId) => ({ tagId })),
      },
    },
  });

  await logFieldChanges(
    taskId,
    userId,
    existing as unknown as Record<string, unknown>,
    updated as unknown as Record<string, unknown>,
    ["title", "description", "status", "priority", "dueAt", "recurrence"],
  );

  const refresh = await getUserRefreshToken(userId);
  if (dueAt) {
    const eventId = await syncTaskToCalendar(updated, refresh);
    if (eventId && eventId !== updated.googleEventId) {
      await prisma.task.update({
        where: { id: taskId },
        data: { googleEventId: eventId },
      });
    }
  } else if (existing.googleEventId) {
    await deleteCalendarEvent(existing.googleEventId, refresh);
    await prisma.task.update({
      where: { id: taskId },
      data: { googleEventId: null },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/tasks/${taskId}`);
  return { ok: true, id: taskId };
}

export async function setTaskStatus(
  taskId: string,
  status: "todo" | "in_progress" | "done",
): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Не авторизован" };

  const existing = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existing || existing.ownerId !== userId || existing.deletedAt) {
    return { ok: false, error: "Задача не найдена" };
  }
  if (existing.status === status) return { ok: true, id: taskId };

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status,
      completedAt: status === "done" ? new Date() : null,
    },
  });
  await logActivity({
    taskId,
    actorId: userId,
    action: "status_changed",
    field: "status",
    oldValue: existing.status,
    newValue: status,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/tasks/${taskId}`);
  return { ok: true, id: taskId };
}

/** Soft delete — moves the task to the trash (Удалённые). */
export async function deleteTask(taskId: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Не авторизован" };

  const existing = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existing || existing.ownerId !== userId) {
    return { ok: false, error: "Задача не найдена" };
  }
  // Remove the calendar event while the task sits in the trash.
  if (existing.googleEventId) {
    const refresh = await getUserRefreshToken(userId);
    await deleteCalendarEvent(existing.googleEventId, refresh);
  }
  await prisma.task.update({
    where: { id: taskId },
    data: { deletedAt: new Date(), googleEventId: null },
  });
  revalidatePath("/dashboard");
  revalidatePath("/trash");
  return { ok: true };
}

/** Restore a soft-deleted task back to the active list. */
export async function restoreTask(taskId: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Не авторизован" };

  const existing = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existing || existing.ownerId !== userId || !existing.deletedAt) {
    return { ok: false, error: "Задача не найдена" };
  }
  const restored = await prisma.task.update({
    where: { id: taskId },
    data: { deletedAt: null },
  });
  // Re-create the calendar event if the task has a deadline.
  if (restored.dueAt) {
    const refresh = await getUserRefreshToken(userId);
    const eventId = await syncTaskToCalendar(restored, refresh);
    if (eventId && eventId !== restored.googleEventId) {
      await prisma.task.update({
        where: { id: taskId },
        data: { googleEventId: eventId },
      });
    }
  }
  revalidatePath("/dashboard");
  revalidatePath("/trash");
  return { ok: true, id: taskId };
}

/** Permanently remove a task (and its attachment files) from the trash. */
export async function deleteTaskPermanently(
  taskId: string,
): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Не авторизован" };

  const existing = await prisma.task.findUnique({
    where: { id: taskId },
    include: { attachments: true },
  });
  if (!existing || existing.ownerId !== userId) {
    return { ok: false, error: "Задача не найдена" };
  }

  // Best-effort cleanup of attachment files in storage.
  if (existing.attachments.length && isStorageConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove(existing.attachments.map((a) => a.storagePath));
    } catch (err) {
      console.error("Storage cleanup failed:", err);
    }
  }

  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/trash");
  return { ok: true };
}

export async function transferTask(
  taskId: string,
  newOwnerId: string,
): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Не авторизован" };

  const existing = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existing || existing.ownerId !== userId || existing.deletedAt) {
    return { ok: false, error: "Задача не найдена" };
  }
  if (newOwnerId === userId) {
    return { ok: false, error: "Задача уже принадлежит вам" };
  }
  const newOwner = await prisma.user.findUnique({ where: { id: newOwnerId } });
  if (!newOwner) return { ok: false, error: "Получатель не найден" };
  const oldOwner = await prisma.user.findUnique({ where: { id: userId } });

  await prisma.task.update({
    where: { id: taskId },
    data: { ownerId: newOwnerId, googleEventId: null },
  });
  await logActivity({
    taskId,
    actorId: userId,
    action: "transferred",
    field: "owner",
    oldValue: oldOwner?.name ?? null,
    newValue: newOwner.name,
  });

  revalidatePath("/dashboard");
  return { ok: true };
}
