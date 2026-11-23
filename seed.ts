import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 1. إنشاء المدير
  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@alrashidi.com" },
    update: {},
    create: {
      email: "admin@alrashidi.com",
      name: "مدير النظام",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // 2. إنشاء الكاشير
  const cashierPassword = await bcrypt.hash("cashier123", 10);
  await prisma.user.upsert({
    where: { email: "cashier@alrashidi.com" },
    update: {},
    create: {
      email: "cashier@alrashidi.com",
      name: "كاشير تجريبي",
      password: cashierPassword,
      role: "CASHIER",
    },
  });

  console.log("✅ تم إضافة المدير والكاشير بنجاح!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });