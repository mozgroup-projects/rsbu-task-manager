# RSBU Task Manager

Онлайн блокнот для управления задачами — внутренний таск-менеджер для небольшой
команды (1–10 человек). Воспроизведение проекта, изначально собранного в Abacus,
на открытом стеке с публикацией в GitHub и деплоем на бесплатный хостинг.

## Возможности

- 🔐 **Аутентификация**: email + пароль (ФИО при регистрации) и вход через Google
- ✅ **Задачи**: статусы (Нужно сделать / В работе / Выполнено), приоритеты,
  дедлайны (дата и время), теги/категории, повторяющиеся задачи
- 🤝 **Передача задач** другому сотруднику (задачи персональные)
- 💬 **Комментарии** к задачам
- 📎 **Вложения** (файлы) через Supabase Storage
- 🕓 **История изменений** каждой задачи (кто, что и когда менял)
- 🔔 **Telegram-напоминания**: ежедневный дайджест задач на сегодня, просроченных
  и ежедневных (через Vercel Cron)
- 📅 **Google Calendar**: дедлайны задач синхронизируются с календарём
- 📱 Адаптивный интерфейс (мобильный UX)

## Стек

- **Next.js 15** (App Router, TypeScript, React 19)
- **Tailwind CSS** + компоненты в стиле shadcn/ui (Radix)
- **Prisma** + **PostgreSQL** (Supabase)
- **Auth.js (NextAuth v5)** — Credentials + Google
- **Supabase Storage** — файлы
- **Telegram Bot API** — напоминания
- **Google Calendar API** — синхронизация
- Хостинг: **Vercel** (включая Vercel Cron)

## Локальный запуск

### 1. Установка зависимостей

```bash
npm install
```

### 2. Переменные окружения

Скопируйте `.env.example` в `.env` и заполните значения:

```bash
cp .env.example .env
```

Минимум для локального запуска — `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`.
Остальные интеграции (Google, Supabase Storage, Telegram) включаются по мере
заполнения соответствующих ключей; без них приложение работает, а интеграции
показывают статус «не настроено».

### 3. База данных

Создайте проект в [Supabase](https://supabase.com) (бесплатно) и возьмите строки
подключения (Project Settings → Database). Затем примените схему:

```bash
npx prisma migrate dev --name init   # создаст таблицы
npm run db:seed                       # (необязательно) демо-данные
```

Демо-пользователи после сидинга: `ivan@rsbu.ru` / `maria@rsbu.ru`, пароль
`password123`.

### 4. Запуск

```bash
npm run dev
```

Откройте http://localhost:3000.

## Настройка интеграций

### Google (вход + Calendar)

1. [Google Cloud Console](https://console.cloud.google.com) → создайте OAuth
   client (тип «Web application»).
2. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (вход)
   - `http://localhost:3000/api/google/callback` (Calendar)
   - аналогичные URL для прод-домена
3. Заполните `GOOGLE_CLIENT_ID` и `GOOGLE_CLIENT_SECRET`.

### Supabase Storage (файлы)

1. В проекте Supabase создайте bucket (по умолчанию имя `attachments`).
2. Заполните `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, при необходимости `SUPABASE_STORAGE_BUCKET`.

### Telegram (напоминания)

1. Создайте бота через [@BotFather](https://t.me/BotFather), получите токен →
   `TELEGRAM_BOT_TOKEN`, имя бота → `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`.
2. После деплоя зарегистрируйте webhook:

   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<домен>/api/telegram/webhook"
   ```

3. Пользователь в разделе «Настройки» копирует код и отправляет боту
   `/start <код>` — это привязывает его Telegram к аккаунту.

### Напоминания (Cron)

`vercel.json` настраивает ежедневный запуск `/api/cron/daily-digest` в 06:00 UTC.
Эндпоинт защищён заголовком `Authorization: Bearer <CRON_SECRET>` (Vercel Cron
передаёт его автоматически). Для ручной проверки:

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" https://<домен>/api/cron/daily-digest
```

## Деплой на Vercel

1. Запушьте репозиторий в GitHub и импортируйте в [Vercel](https://vercel.com).
2. Добавьте все переменные окружения из `.env.example` (с прод-значениями;
   `NEXTAUTH_URL` = адрес деплоя).
3. Vercel выполнит `npm run build` (включает `prisma generate`). Применить
   миграции к проду:

   ```bash
   npx prisma migrate deploy
   ```

4. Зарегистрируйте Telegram webhook на прод-URL и обновите Google OAuth redirect
   URIs.

## Структура

```
app/
  (auth)/            — вход и регистрация
  (app)/             — защищённая часть (dashboard, tasks, settings)
    actions/         — server actions (задачи, теги, комментарии, настройки)
  api/               — route handlers (auth, register, attachments, telegram,
                       cron, google)
components/          — UI и доменные компоненты
  ui/                — примитивы в стиле shadcn/ui
lib/                 — prisma, auth, supabase, telegram, google-calendar и т.д.
prisma/              — схема и сид
```

## Лицензия

MIT — см. [LICENSE](./LICENSE).
