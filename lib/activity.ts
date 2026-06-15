import { prisma } from "@/lib/prisma";
import type { ActivityAction } from "@prisma/client";

type LogInput = {
  taskId: string;
  actorId: string;
  action: ActivityAction;
  field?: string;
  oldValue?: string | null;
  newValue?: string | null;
};

/** Append a single entry to a task's activity log (history). */
export async function logActivity(input: LogInput) {
  return prisma.activityLog.create({
    data: {
      taskId: input.taskId,
      actorId: input.actorId,
      action: input.action,
      field: input.field,
      oldValue: input.oldValue ?? null,
      newValue: input.newValue ?? null,
    },
  });
}

/** Compare two task snapshots and log every changed scalar field. */
export async function logFieldChanges(
  taskId: string,
  actorId: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: string[],
) {
  const entries: LogInput[] = [];
  for (const field of fields) {
    const oldV = before[field];
    const newV = after[field];
    const norm = (v: unknown) =>
      v instanceof Date ? v.toISOString() : v == null ? null : String(v);
    if (norm(oldV) !== norm(newV)) {
      entries.push({
        taskId,
        actorId,
        action: field === "status" ? "status_changed" : "updated",
        field,
        oldValue: norm(oldV),
        newValue: norm(newV),
      });
    }
  }
  if (entries.length) {
    await prisma.activityLog.createMany({ data: entries });
  }
  return entries.length;
}
