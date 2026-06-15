"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import type { Tag } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskCard } from "@/components/task-card";
import { TaskFormDialog } from "@/components/task-form-dialog";
import {
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  STATUS_LABELS,
  STATUS_ORDER,
} from "@/lib/constants";
import type { TaskWithMeta } from "@/lib/queries";

export function DashboardView({
  tasks,
  tags,
}: {
  tasks: TaskWithMeta[];
  tags: Tag[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [tagId, setTagId] = useState("all");

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (status !== "all" && t.status !== status) return false;
      if (priority !== "all" && t.priority !== priority) return false;
      if (tagId !== "all" && !t.tags.some((x) => x.tagId === tagId))
        return false;
      if (search) {
        const q = search.toLowerCase();
        const inTitle = t.title.toLowerCase().includes(q);
        const inDesc = t.description?.toLowerCase().includes(q);
        if (!inTitle && !inDesc) return false;
      }
      return true;
    });
  }, [tasks, status, priority, tagId, search]);

  const groups = useMemo(() => {
    return STATUS_ORDER.map((s) => ({
      status: s,
      label: STATUS_LABELS[s],
      items: filtered.filter((t) => t.status === s),
    }));
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск задач..."
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Новая задача
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Приоритет" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все приоритеты</SelectItem>
            {PRIORITY_ORDER.map((p) => (
              <SelectItem key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {tags.length > 0 && (
          <Select value={tagId} onValueChange={setTagId}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Тег" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все теги</SelectItem>
              {tags.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          Задач не найдено. Создайте первую задачу.
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(
            (g) =>
              g.items.length > 0 && (
                <section key={g.status} className="space-y-2">
                  <h2 className="text-sm font-semibold text-muted-foreground">
                    {g.label}{" "}
                    <span className="text-xs font-normal">({g.items.length})</span>
                  </h2>
                  <div className="grid gap-2">
                    {g.items.map((t) => (
                      <TaskCard key={t.id} task={t} />
                    ))}
                  </div>
                </section>
              ),
          )}
        </div>
      )}

      <TaskFormDialog open={createOpen} onOpenChange={setCreateOpen} tags={tags} />
    </div>
  );
}
