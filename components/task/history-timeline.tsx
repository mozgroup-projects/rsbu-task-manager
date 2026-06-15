import type { ActivityAction } from "@prisma/client";
import { ACTIVITY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/constants";
import { formatDateTime, formatDate } from "@/lib/format";

type ActivityItem = {
  id: string;
  action: ActivityAction;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date | string;
  actor: { id: string; name: string };
};

const FIELD_LABELS: Record<string, string> = {
  title: "название",
  description: "описание",
  status: "статус",
  priority: "приоритет",
  dueAt: "дедлайн",
  recurrence: "повтор",
  owner: "владельца",
};

function humanValue(field: string | null, value: string | null): string {
  if (!value) return "—";
  if (field === "status") return STATUS_LABELS[value as keyof typeof STATUS_LABELS] ?? value;
  if (field === "priority")
    return PRIORITY_LABELS[value as keyof typeof PRIORITY_LABELS] ?? value;
  if (field === "dueAt") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : formatDate(d);
  }
  return value;
}

function describe(item: ActivityItem): string {
  const base = ACTIVITY_LABELS[item.action] ?? item.action;
  if (item.action === "status_changed") {
    return `${ACTIVITY_LABELS.status_changed}: ${humanValue("status", item.oldValue)} → ${humanValue("status", item.newValue)}`;
  }
  if (item.action === "transferred") {
    return `${ACTIVITY_LABELS.transferred}: ${humanValue("owner", item.oldValue)} → ${humanValue("owner", item.newValue)}`;
  }
  if (item.action === "updated" && item.field) {
    const fieldLabel = FIELD_LABELS[item.field] ?? item.field;
    return `изменил(а) ${fieldLabel}`;
  }
  if (item.action === "attachment_added" && item.newValue) {
    return `${ACTIVITY_LABELS.attachment_added}: ${item.newValue}`;
  }
  return base;
}

export function HistoryTimeline({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">История пуста.</p>;
  }
  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="flex gap-3 text-sm">
          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/60" />
          <div>
            <p>
              <span className="font-medium">{item.actor.name}</span>{" "}
              {describe(item)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(item.createdAt)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
