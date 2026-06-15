import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function code(len = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: len },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const ivan = await prisma.user.upsert({
    where: { email: "ivan@rsbu.ru" },
    update: {},
    create: {
      name: "Иванов Иван Иванович",
      email: "ivan@rsbu.ru",
      passwordHash,
      telegramLinkCode: code(),
    },
  });

  const maria = await prisma.user.upsert({
    where: { email: "maria@rsbu.ru" },
    update: {},
    create: {
      name: "Петрова Мария Сергеевна",
      email: "maria@rsbu.ru",
      passwordHash,
      telegramLinkCode: code(),
    },
  });

  const tagWork = await prisma.tag.upsert({
    where: { ownerId_name: { ownerId: ivan.id, name: "Работа" } },
    update: {},
    create: { name: "Работа", color: "#2463EB", ownerId: ivan.id },
  });

  const tagUrgent = await prisma.tag.upsert({
    where: { ownerId_name: { ownerId: ivan.id, name: "Важное" } },
    update: {},
    create: { name: "Важное", color: "#DC2626", ownerId: ivan.id },
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12, 0, 0, 0);

  const task = await prisma.task.create({
    data: {
      title: "Подготовить отчёт за квартал",
      description: "Свести данные и отправить руководству.",
      status: "todo",
      priority: "high",
      dueAt: tomorrow,
      ownerId: ivan.id,
      createdById: ivan.id,
      tags: {
        create: [{ tagId: tagWork.id }, { tagId: tagUrgent.id }],
      },
      activity: {
        create: { actorId: ivan.id, action: "created" },
      },
    },
  });

  await prisma.comment.create({
    data: {
      taskId: task.id,
      authorId: ivan.id,
      body: "Начал собирать данные.",
    },
  });

  await prisma.task.create({
    data: {
      title: "Ежедневная планёрка",
      status: "todo",
      priority: "medium",
      recurrence: "daily",
      ownerId: maria.id,
      createdById: maria.id,
      activity: { create: { actorId: maria.id, action: "created" } },
    },
  });

  console.log("Seed complete:", { ivan: ivan.email, maria: maria.email });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
