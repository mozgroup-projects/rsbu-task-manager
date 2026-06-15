"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PriorityBadge, TagChip } from "@/components/task-badges";
import {
  restoreTask,
  deleteTaskPermanently,
} from "@/app/(app)/actions/tasks";
import { formatRelative } from "@/lib/format";
import type { TaskWithMeta } from "@/lib/queries";

export function TrashView({ tasks }: { tasks: TaskWithMeta[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmTask, setConfirmTask] = useState<TaskWithMeta | null>(null);

  async function onRestore(id: string) {
    setPendingId(id);
    const res = await restoreTask(id);
    setPendingId(null);
    if (!res.ok) {
      toast.error(res.error ?? "Ошибка");
      return;
    }
    toast.success("Задача восстановлена");
    router.refresh();
  }

  async function onPurge() {
    if (!confirmTask) return;
    setPendingId(confirmTask.id);
    const res = await deleteTaskPermanently(confirmTask.id);
    setPendingId(null);
    setConfirmTask(null);
    if (!res.ok) {
      toast.error(res.error ?? "Ошибка");
      return;
    }
    toast.success("Задача удалена навсегда");
    router.refresh();
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
        Корзина пуста.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-2">
        {tasks.map((task) => (
          <Card key={task.id} className="p-3">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug">{task.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <PriorityBadge priority={task.priority} />
                  {task.tags.map((t) => (
                    <TagChip key={t.tagId} name={t.tag.name} color={t.tag.color} />
                  ))}
                  {task.deletedAt && (
                    <span className="text-xs text-muted-foreground">
                      удалена {formatRelative(task.deletedAt)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRestore(task.id)}
                  disabled={pendingId === task.id}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Восстановить</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setConfirmTask(task)}
                  disabled={pendingId === task.id}
                  aria-label="Удалить навсегда"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog
        open={Boolean(confirmTask)}
        onOpenChange={(v) => !v && setConfirmTask(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить навсегда?</DialogTitle>
            <DialogDescription>
              Задача «{confirmTask?.title}» и все её данные (комментарии, файлы,
              история) будут удалены безвозвратно.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTask(null)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={onPurge}
              disabled={pendingId === confirmTask?.id}
            >
              Удалить навсегда
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
