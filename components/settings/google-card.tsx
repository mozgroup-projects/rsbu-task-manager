"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { disconnectGoogleCalendar } from "@/app/(app)/actions/settings";

export function GoogleCard({
  connected,
  configured,
}: {
  connected: boolean;
  configured: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDisconnect() {
    setLoading(true);
    const res = await disconnectGoogleCalendar();
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error ?? "Ошибка");
      return;
    }
    toast.success("Google Calendar отключён");
    router.refresh();
  }

  if (!configured) {
    return (
      <p className="text-sm text-muted-foreground">
        Google OAuth не настроен (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).
      </p>
    );
  }

  if (connected) {
    return (
      <div className="space-y-3">
        <Badge variant="secondary" className="gap-1">
          <Check className="h-3 w-3" /> Подключено
        </Badge>
        <p className="text-sm text-muted-foreground">
          Задачи с дедлайном автоматически добавляются в ваш Google Календарь.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onDisconnect}
          disabled={loading}
        >
          Отключить
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Подключите Google Календарь, чтобы дедлайны задач появлялись как
        события.
      </p>
      <Button asChild size="sm">
        <a href="/api/google/connect">Подключить Google Calendar</a>
      </Button>
    </div>
  );
}
