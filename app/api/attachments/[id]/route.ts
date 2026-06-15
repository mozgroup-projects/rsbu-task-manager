import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { getSupabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase";

async function loadOwned(attachmentId: string, userId: string) {
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    include: { task: { select: { ownerId: true } } },
  });
  if (!attachment || attachment.task.ownerId !== userId) return null;
  return attachment;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }
  const { id } = await params;
  const attachment = await loadOwned(id, userId);
  if (!attachment) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(attachment.storagePath, 60, {
      download: attachment.fileName,
    });
  if (error || !data) {
    return NextResponse.json(
      { error: "Не удалось получить файл" },
      { status: 500 },
    );
  }
  return NextResponse.redirect(data.signedUrl);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }
  const { id } = await params;
  const attachment = await loadOwned(id, userId);
  if (!attachment) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  await supabase.storage.from(STORAGE_BUCKET).remove([attachment.storagePath]);
  await prisma.attachment.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
