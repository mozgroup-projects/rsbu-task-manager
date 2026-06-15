import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import {
  getSupabaseAdmin,
  isStorageConfigured,
  STORAGE_BUCKET,
} from "@/lib/supabase";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }
  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Хранилище файлов не настроено" },
      { status: 503 },
    );
  }

  const { id: taskId } = await params;
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.ownerId !== userId) {
    return NextResponse.json({ error: "Задача не найдена" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Файл слишком большой (макс. 10 МБ)" },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const storagePath = `${taskId}/${Date.now()}_${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (error) {
    console.error("Supabase upload error:", error);
    return NextResponse.json(
      { error: "Не удалось загрузить файл" },
      { status: 500 },
    );
  }

  const attachment = await prisma.attachment.create({
    data: {
      taskId,
      uploadedById: userId,
      fileName: file.name,
      storagePath,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
    },
  });
  await logActivity({
    taskId,
    actorId: userId,
    action: "attachment_added",
    newValue: file.name,
  });

  return NextResponse.json({ ok: true, id: attachment.id });
}
