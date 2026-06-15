import type { TaskStatus, TaskPriority, Recurrence } from "@prisma/client";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Нужно сделать",
  in_progress: "В работе",
  done: "Выполнено",
};

export const STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "done"];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  urgent: "Срочный",
};

export const PRIORITY_ORDER: TaskPriority[] = ["low", "medium", "high", "urgent"];

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  high: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  none: "Без повтора",
  daily: "Каждый день",
  weekly: "Каждую неделю",
  monthly: "Каждый месяц",
};

export const TAG_COLORS = [
  "#2463EB",
  "#16A34A",
  "#DC2626",
  "#D97706",
  "#7C3AED",
  "#0891B2",
  "#DB2777",
  "#475569",
];

export const ACTIVITY_LABELS: Record<string, string> = {
  created: "создал(а) задачу",
  updated: "изменил(а)",
  status_changed: "изменил(а) статус",
  transferred: "передал(а) задачу",
  commented: "оставил(а) комментарий",
  attachment_added: "добавил(а) файл",
  reminder_sent: "отправлено напоминание",
};
