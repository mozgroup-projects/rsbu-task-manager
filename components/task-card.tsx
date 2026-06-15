"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MessageSquare, Paperclip, Repeat } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import {
  PriorityBadge,
  DueBadge,
  TagChip,
} from "@/components/task-badges";
import { setTaskStatus } from "@/app/(app)/actions/tasks";
import type { TaskWithMeta } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function TaskCard({ task }: { task: TaskWithMeta }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const done = task.status === "done";

  async function toggleDone(checked: boolean) {
    setPending(true);
    const res = await setTaskStatus(task.id, checked ? "done" : "todo");
    setPending(false);
    if (!res.ok) {
      toast.error(res.error ?? "Ошибка");
      return;
    }
    router.refresh();
  }

  return (
    <Card className="p-3 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="pt-0.5">
          <Checkbox
            checked={done}
            disabled={pending}
            onCheckedChange={(v) => toggleDone(Boolean(v))}
            aria-label="Отметить выполненной"
          />
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/tasks/${task.id}`} className="block">
            <p
              className={cn(
                "font-medium leading-snug",
                done && "text-muted-foreground line-through",
              )}
            >
              {task.title}
            </p>
            {task.description && (
              <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                {task.description}
              </p>
            )}
          </Link>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PriorityBadge priority={task.priority} />
            {task.dueAt && <DueBadge dueAt={task.dueAt} />}
            {task.recurrence !== "none" && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Repeat className="h-3 w-3" />
              </span>
            )}
            {task.tags.map((t) => (
              <TagChip key={t.tagId} name={t.tag.name} color={t.tag.color} />
            ))}
            {task._count.comments > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                {task._count.comments}
              </span>
            )}
            {task._count.attachments > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Paperclip className="h-3 w-3" />
                {task._count.attachments}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
