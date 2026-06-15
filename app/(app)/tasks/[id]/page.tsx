import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User } from "lucide-react";
import { requireSession } from "@/lib/session";
import { getTask, getUserTags, getOtherUsers } from "@/lib/queries";
import { isStorageConfigured } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  PriorityBadge,
  StatusBadge,
  DueBadge,
  TagChip,
} from "@/components/task-badges";
import { TaskActions } from "@/components/task/task-actions";
import { CommentsSection } from "@/components/task/comments-section";
import { AttachmentsSection } from "@/components/task/attachments-section";
import { HistoryTimeline } from "@/components/task/history-timeline";
import { RECURRENCE_LABELS } from "@/lib/constants";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const userId = session.user.id;

  const [task, tags, users] = await Promise.all([
    getTask(id, userId),
    getUserTags(userId),
    getOtherUsers(userId),
  ]);

  if (!task) notFound();

  const taskInitial = {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueAt: task.dueAt,
    recurrence: task.recurrence,
    remindersEnabled: task.remindersEnabled,
    tagIds: task.tags.map((t) => t.tagId),
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4" /> К задачам
        </Link>
      </Button>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {task.dueAt && <DueBadge dueAt={task.dueAt} />}
            {task.recurrence !== "none" && (
              <span className="text-xs text-muted-foreground">
                {RECURRENCE_LABELS[task.recurrence]}
              </span>
            )}
          </div>
          <CardTitle className="text-xl">{task.title}</CardTitle>
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {task.tags.map((t) => (
                <TagChip key={t.tagId} name={t.tag.name} color={t.tag.color} />
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {task.description && (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5" /> Владелец: {task.owner.name}
            {task.createdBy.id !== task.owner.id && (
              <> · Создал: {task.createdBy.name}</>
            )}
          </div>
          <Separator />
          <TaskActions task={taskInitial} tags={tags} users={users} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="comments">
            <TabsList>
              <TabsTrigger value="comments">
                Комментарии ({task.comments.length})
              </TabsTrigger>
              <TabsTrigger value="files">
                Файлы ({task.attachments.length})
              </TabsTrigger>
              <TabsTrigger value="history">История</TabsTrigger>
            </TabsList>
            <TabsContent value="comments">
              <CommentsSection
                taskId={task.id}
                comments={task.comments}
                currentUserId={userId}
              />
            </TabsContent>
            <TabsContent value="files">
              <AttachmentsSection
                taskId={task.id}
                attachments={task.attachments}
                storageEnabled={isStorageConfigured()}
              />
            </TabsContent>
            <TabsContent value="history">
              <HistoryTimeline items={task.activity} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
