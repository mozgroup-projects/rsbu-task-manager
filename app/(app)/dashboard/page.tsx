import { ListTodo, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { requireSession } from "@/lib/session";
import { getUserTasks, getUserTags, getTaskStats } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { DashboardView } from "@/components/dashboard-view";

export default async function DashboardPage() {
  const session = await requireSession();
  const userId = session.user.id;

  const [tasks, tags, stats] = await Promise.all([
    getUserTasks(userId),
    getUserTags(userId),
    getTaskStats(userId),
  ]);

  const cards = [
    { label: "Нужно сделать", value: stats.todo, icon: ListTodo, color: "text-slate-600" },
    { label: "В работе", value: stats.inProgress, icon: Loader2, color: "text-blue-600" },
    { label: "Выполнено", value: stats.done, icon: CheckCircle2, color: "text-green-600" },
    { label: "Просрочено", value: stats.overdue, icon: AlertTriangle, color: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Мои задачи</h1>
        <p className="text-sm text-muted-foreground">
          Управляйте задачами, дедлайнами и напоминаниями.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="flex items-center gap-3 p-4">
              <Icon className={`h-5 w-5 ${c.color}`} />
              <div>
                <div className="text-2xl font-semibold">{c.value}</div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
              </div>
            </Card>
          );
        })}
      </div>

      <DashboardView tasks={tasks} tags={tags} />
    </div>
  );
}
