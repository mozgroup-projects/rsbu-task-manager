import { Clock } from "lucide-react";
import type { TaskPriority, TaskStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from "@/lib/constants";
import { formatDue } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        PRIORITY_COLORS[priority],
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  done: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function DueBadge({ dueAt }: { dueAt: Date | string }) {
  const { label, overdue } = formatDue(dueAt);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs",
        overdue ? "text-destructive font-medium" : "text-muted-foreground",
      )}
    >
      <Clock className="h-3 w-3" />
      {label}
    </span>
  );
}

export function TagChip({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{ borderColor: color, color }}
    >
      {name}
    </span>
  );
}
