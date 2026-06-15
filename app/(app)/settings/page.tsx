import { requireSession } from "@/lib/session";
import { getCurrentUser, getUserTags } from "@/lib/queries";
import { isTelegramConfigured } from "@/lib/telegram";
import { isGoogleConfigured } from "@/lib/google-calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";
import { TelegramCard } from "@/components/settings/telegram-card";
import { GoogleCard } from "@/components/settings/google-card";
import { TagsManager } from "@/components/settings/tags-manager";

export default async function SettingsPage() {
  const session = await requireSession();
  const userId = session.user.id;

  const [user, tags] = await Promise.all([
    getCurrentUser(userId),
    getUserTags(userId),
  ]);
  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Настройки</h1>
        <p className="text-sm text-muted-foreground">
          Профиль, уведомления и интеграции.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Профиль</CardTitle>
          <CardDescription>Ваши личные данные.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initialName={user.name}
            initialTimezone={user.timezone}
            email={user.email}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Telegram-напоминания</CardTitle>
          <CardDescription>
            Ежедневный дайджест задач на сегодня и просроченных.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TelegramCard
            connected={Boolean(user.telegramChatId)}
            linkCode={user.telegramLinkCode}
            botUsername={process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? null}
            botConfigured={isTelegramConfigured()}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Google Calendar</CardTitle>
          <CardDescription>
            Синхронизация дедлайнов с календарём.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleCard
            connected={Boolean(user.googleRefreshToken)}
            configured={isGoogleConfigured()}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Теги</CardTitle>
          <CardDescription>Категории для задач.</CardDescription>
        </CardHeader>
        <CardContent>
          <TagsManager tags={tags} />
        </CardContent>
      </Card>
    </div>
  );
}
