import { requireSession } from "@/lib/session";
import { getDeletedTasks } from "@/lib/queries";
import { TrashView } from "@/components/trash-view";

export default async function TrashPage() {
  const session = await requireSession();
  const tasks = await getDeletedTasks(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Удалённые</h1>
        <p className="text-sm text-muted-foreground">
          Удалённые задачи можно восстановить или удалить навсегда.
        </p>
      </div>
      <TrashView tasks={tasks} />
    </div>
  );
}
