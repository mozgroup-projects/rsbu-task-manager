import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from "date-fns";
import { ru } from "date-fns/locale";

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "d MMM yyyy, HH:mm", { locale: ru });
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "d MMM yyyy", { locale: ru });
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: ru });
}

/** Human label for a deadline with overdue awareness. */
export function formatDue(date: Date | string): {
  label: string;
  overdue: boolean;
} {
  const d = typeof date === "string" ? new Date(date) : date;
  const time = format(d, "HH:mm", { locale: ru });
  let label: string;
  if (isToday(d)) label = `Сегодня, ${time}`;
  else if (isTomorrow(d)) label = `Завтра, ${time}`;
  else label = format(d, "d MMM, HH:mm", { locale: ru });
  return { label, overdue: isPast(d) };
}

/** Convert a Date to the value format used by <input type="datetime-local">. */
export function toDateTimeLocal(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
