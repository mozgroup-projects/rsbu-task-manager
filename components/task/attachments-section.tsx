"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Paperclip, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/format";

type AttachmentItem = {
  id: string;
  fileName: string;
  size: number;
  createdAt: Date | string;
  uploadedBy: { id: string; name: string };
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export function AttachmentsSection({
  taskId,
  attachments,
  storageEnabled,
}: {
  taskId: string;
  attachments: AttachmentItem[];
  storageEnabled: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/tasks/${taskId}/attachments`, {
      method: "POST",
      body: fd,
    });
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Не удалось загрузить файл");
      return;
    }
    toast.success("Файл загружен");
    router.refresh();
  }

  async function onDelete(id: string) {
    const res = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Не удалось удалить файл");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {!storageEnabled && (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Хранилище файлов не настроено (Supabase Storage).
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={onFile}
        disabled={!storageEnabled || uploading}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={!storageEnabled || uploading}
      >
        <Upload className="h-4 w-4" />
        {uploading ? "Загрузка..." : "Загрузить файл"}
      </Button>

      {attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Нет вложений.</p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 rounded-md border p-2"
            >
              <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(a.size)} · {a.uploadedBy.name} ·{" "}
                  {formatRelative(a.createdAt)}
                </p>
              </div>
              <a
                href={`/api/attachments/${a.id}`}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Скачать"
              >
                <Download className="h-4 w-4" />
              </a>
              <button
                onClick={() => onDelete(a.id)}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Удалить"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
