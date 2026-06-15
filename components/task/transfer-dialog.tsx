"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { transferTask } from "@/app/(app)/actions/tasks";

export function TransferDialog({
  open,
  onOpenChange,
  taskId,
  users,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  taskId: string;
  users: { id: string; name: string; email: string }[];
}) {
  const router = useRouter();
  const [target, setTarget] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function onConfirm() {
    if (!target) {
      toast.error("Выберите получателя");
      return;
    }
    setLoading(true);
    const res = await transferTask(taskId, target);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error ?? "Ошибка");
      return;
    }
    toast.success("Задача передана");
    onOpenChange(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Передать задачу</DialogTitle>
          <DialogDescription>
            Выберите сотрудника, которому передать задачу. После передачи задача
            появится у него.
          </DialogDescription>
        </DialogHeader>

        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Нет других пользователей для передачи.
          </p>
        ) : (
          <div className="space-y-2">
            <Label>Получатель</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите сотрудника" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={onConfirm} disabled={loading || users.length === 0}>
            {loading ? "Передача..." : "Передать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
