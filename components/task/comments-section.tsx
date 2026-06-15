"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { addComment, deleteComment } from "@/app/(app)/actions/comments";
import { formatRelative } from "@/lib/format";

type CommentItem = {
  id: string;
  body: string;
  createdAt: Date | string;
  authorId: string;
  author: { id: string; name: string; image: string | null };
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function CommentsSection({
  taskId,
  comments,
  currentUserId,
}: {
  taskId: string;
  comments: CommentItem[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    const res = await addComment({ taskId, body });
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error ?? "Ошибка");
      return;
    }
    setBody("");
    router.refresh();
  }

  async function onDelete(id: string) {
    const res = await deleteComment(id);
    if (!res.ok) {
      toast.error(res.error ?? "Ошибка");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Добавить комментарий..."
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={loading || !body.trim()}>
            {loading ? "Отправка..." : "Отправить"}
          </Button>
        </div>
      </form>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Пока нет комментариев.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                {c.author.image && <AvatarImage src={c.author.image} alt="" />}
                <AvatarFallback className="text-xs">
                  {initials(c.author.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.author.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelative(c.createdAt)}
                  </span>
                  {c.authorId === currentUserId && (
                    <button
                      onClick={() => onDelete(c.id)}
                      className="ml-auto text-muted-foreground hover:text-destructive"
                      aria-label="Удалить комментарий"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
