"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  regenerateTelegramCode,
  disconnectTelegram,
} from "@/app/(app)/actions/settings";

export function TelegramCard({
  connected,
  linkCode,
  botUsername,
  botConfigured,
}: {
  connected: boolean;
  linkCode: string | null;
  botUsername: string | null;
  botConfigured: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const command = `/start ${linkCode ?? ""}`;
  const deepLink =
    botUsername && linkCode
      ? `https://t.me/${botUsername}?start=${linkCode}`
      : null;

  async function onRegenerate() {
    setLoading(true);
    const res = await regenerateTelegramCode();
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error ?? "Ошибка");
      return;
    }
    toast.success("Код обновлён");
    router.refresh();
  }

  async function onDisconnect() {
    setLoading(true);
    const res = await disconnectTelegram();
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error ?? "Ошибка");
      return;
    }
    toast.success("Telegram отключён");
    router.refresh();
  }

  function copy() {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!botConfigured) {
    return (
      <p className="text-sm text-muted-foreground">
        Telegram-бот не настроен (TELEGRAM_BOT_TOKEN).
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
          Вы будете получать ежедневный дайджест задач в Telegram.
        </p>
        <Button variant="outline" size="sm" onClick={onDisconnect} disabled={loading}>
          Отключить
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Чтобы получать напоминания, откройте бота и отправьте команду:
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm">
          {command}
        </code>
        <Button variant="outline" size="icon" onClick={copy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {deepLink && (
          <Button asChild size="sm">
            <a href={deepLink} target="_blank" rel="noreferrer">
              Открыть бота
            </a>
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onRegenerate}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4" /> Новый код
        </Button>
      </div>
    </div>
  );
}
