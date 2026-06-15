"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Tag } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  STATUS_LABELS,
  STATUS_ORDER,
  RECURRENCE_LABELS,
} from "@/lib/constants";
import { createTask, updateTask } from "@/app/(app)/actions/tasks";
import { toDateTimeLocal } from "@/lib/format";
import { cn } from "@/lib/utils";

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

export function TaskFormDialog({
  open,
  onOpenChange,
  tags,
  task,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tags: Tag[];
  task?: TaskInitial;
}) {
  const router = useRouter();
  const isEdit = Boolean(task);
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(task?.tagIds ?? []);
  const [status, setStatus] = useState(task?.status ?? "todo");
  const [priority, setPriority] = useState(task?.priority ?? "medium");
  const [recurrence, setRecurrence] = useState(task?.recurrence ?? "none");
  const [reminders, setReminders] = useState(task?.remindersEnabled ?? true);

  function toggleTag(id: string) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      status,
      priority,
      dueAt: String(form.get("dueAt") ?? "") || null,
      recurrence,
      remindersEnabled: reminders,
      tagIds: selectedTags,
    };
    const res = isEdit
      ? await updateTask(task!.id, payload)
      : await createTask(payload);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error ?? "Ошибка");
      return;
    }
    toast.success(isEdit ? "Задача обновлена" : "Задача создана");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Редактировать задачу" : "Новая задача"}
          </DialogTitle>
          <DialogDescription>
            Заполните детали задачи и сохраните.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Название</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={task?.title}
              placeholder="Что нужно сделать?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={task?.description ?? ""}
              placeholder="Дополнительные детали (необязательно)"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Приоритет</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_ORDER.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="dueAt">Дедлайн</Label>
              <Input
                id="dueAt"
                name="dueAt"
                type="datetime-local"
                defaultValue={toDateTimeLocal(task?.dueAt)}
              />
            </div>
            <div className="space-y-2">
              <Label>Повтор</Label>
              <Select value={recurrence} onValueChange={setRecurrence}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RECURRENCE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {tags.length > 0 && (
            <div className="space-y-2">
              <Label>Теги</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const active = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        active
                          ? "text-white"
                          : "bg-background text-foreground",
                      )}
                      style={
                        active
                          ? { backgroundColor: tag.color, borderColor: tag.color }
                          : { borderColor: tag.color, color: tag.color }
                      }
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              id="reminders"
              checked={reminders}
              onCheckedChange={(v) => setReminders(Boolean(v))}
            />
            <Label htmlFor="reminders" className="cursor-pointer font-normal">
              Напоминать в Telegram
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
