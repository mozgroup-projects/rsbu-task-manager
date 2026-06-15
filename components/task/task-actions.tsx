"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Tag } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskFormDialog } from "@/components/task-form-dialog";
import { TransferDialog } from "@/components/task/transfer-dialog";
import { deleteTask } from "@/app/(app)/actions/tasks";

type TaskInitial = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueAt: Date | string | null;
  recurrence: string;
  remindersEnabled: boolean;
  tagIds: string[];
};

export function TaskActions({
  task,
  tags,
  users,
}: {
  task: TaskInitial;
  tags: Tag[];
  users: { id: string; name: string; email: string }[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    setDeleting(true);
    const res = await deleteTask(task.id);
    setDeleting(false);
    if (!res.ok) {
      toast.error(res.error ?? "Ошибка");
      return;
    }
    toast.success("Задача удалена");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4" /> Редактировать
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTransferOpen(true)}
        >
          <Send className="h-4 w-4" /> Передать
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4" /> Удалить
        </Button>
      </div>

      <TaskFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        tags={tags}
        task={task}
      />
      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        taskId={task.id}
        users={users}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить задачу?</DialogTitle>
            <DialogDescription>
              Задача переедет в раздел «Удалённые». Оттуда её можно восстановить
              или удалить навсегда.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={deleting}
            >
              {deleting ? "Удаление..." : "Удалить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
