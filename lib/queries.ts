import { prisma } from "@/lib/prisma";
import type { Prisma, TaskStatus, TaskPriority } from "@prisma/client";

export type TaskFilters = {
  status?: TaskStatus;
  priority?: TaskPriority;
  tagId?: string;
  search?: string;
};

const taskInclude = {
  tags: { include: { tag: true } },
  _count: { select: { comments: true, attachments: true } },
} satisfies Prisma.TaskInclude;

export type TaskWithMeta = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

export async function getUserTasks(userId: string, filters: TaskFilters = {}) {
  const where: Prisma.TaskWhereInput = { ownerId: userId, deletedAt: null };
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.tagId) where.tags = { some: { tagId: filters.tagId } };
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy: [{ status: "asc" }, { dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
  });
}

export async function getTaskStats(userId: string) {
  const [todo, inProgress, done, overdue] = await Promise.all([
    prisma.task.count({ where: { ownerId: userId, status: "todo", deletedAt: null } }),
    prisma.task.count({ where: { ownerId: userId, status: "in_progress", deletedAt: null } }),
    prisma.task.count({ where: { ownerId: userId, status: "done", deletedAt: null } }),
    prisma.task.count({
      where: {
        ownerId: userId,
        status: { not: "done" },
        deletedAt: null,
        dueAt: { lt: new Date() },
      },
    }),
  ]);
  return { todo, inProgress, done, overdue };
}

export async function getTask(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      tags: { include: { tag: true } },
      owner: { select: { id: true, name: true, image: true } },
      createdBy: { select: { id: true, name: true } },
      comments: {
        include: { author: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
      attachments: {
        include: { uploadedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      activity: {
        include: { actor: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!task || task.ownerId !== userId || task.deletedAt) return null;
  return task;
}

export async function getDeletedTasks(userId: string) {
  return prisma.task.findMany({
    where: { ownerId: userId, deletedAt: { not: null } },
    include: taskInclude,
    orderBy: { deletedAt: "desc" },
  });
}

export async function getUserTags(userId: string) {
  return prisma.tag.findMany({
    where: { ownerId: userId },
    orderBy: { name: "asc" },
  });
}

export async function getOtherUsers(userId: string) {
  return prisma.user.findMany({
    where: { id: { not: userId } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

export async function getCurrentUser(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}
