"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { Tag } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTag, deleteTag } from "@/app/(app)/actions/tags";
import { TAG_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function TagsManager({ tags }: { tags: Tag[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [color, setColor] = useState(TAG_COLORS[0]);
  const [loading, setLoading] = useState(false);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const res = await createTag({ name, color });
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error ?? "Ошибка");
      return;
    }
    setName("");
    router.refresh();
  }

  async function onDelete(id: string) {
    const res = await deleteTag(id);
    if (!res.ok) {
      toast.error(res.error ?? "Ошибка");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onCreate} className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название тега"
          />
          <Button type="submit" size="icon" disabled={loading || !name.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {TAG_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "h-6 w-6 rounded-full border-2 transition-transform",
                color === c ? "scale-110 border-foreground" : "border-transparent",
              )}
              style={{ backgroundColor: c }}
              aria-label={`Цвет ${c}`}
            />
          ))}
        </div>
      </form>

      {tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">Тегов пока нет.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium"
              style={{ borderColor: tag.color, color: tag.color }}
            >
              {tag.name}
              <button
                onClick={() => onDelete(tag.id)}
                className="hover:opacity-70"
                aria-label="Удалить тег"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
