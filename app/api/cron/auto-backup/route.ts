import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  try {
    // التحقق من مفتاح سري (لحماية الـ endpoint)
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    if (key !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const settings = await prisma.settings.findUnique({ where: { id: "global" } });
    if (!settings?.autoBackupEnabled) {
      return NextResponse.json({ message: "النسخ التلقائي معطل" });
    }

    // التحقق من الوقت (هل حان وقت النسخ؟)
    const now = new Date();
    const lastBackup = settings.lastBackupAt;
    let shouldBackup = false;

    if (!lastBackup) {
      shouldBackup = true;
    } else {
      const hoursSince = (now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60);
      if (settings.autoBackupFrequency === "DAILY" && hoursSince >= 24) shouldBackup = true;
      if (settings.autoBackupFrequency === "WEEKLY" && hoursSince >= 168) shouldBackup = true;
    }

    if (!shouldBackup) {
      return NextResponse.json({ message: "لم يحن وقت النسخ بعد" });
    }

    // إنشاء النسخة
    const backupData = await getBackupData();

    const backupsDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const timestamp = now.toISOString().replace(/[:.]/g, "-");
    const fileName = `backup-${timestamp}.json`;
    fs.writeFileSync(path.join(backupsDir, fileName), JSON.stringify(backupData, null, 2), "utf-8");

    await prisma.settings.update({
      where: { id: "global" },
      data: { lastBackupAt: now },
    });

    // حذف القديم (آخر 10)
    const files = fs.readdirSync(backupsDir).filter((f) => f.startsWith("backup-")).sort().reverse();
    files.slice(10).forEach((oldFile) => fs.unlinkSync(path.join(backupsDir, oldFile)));

    return NextResponse.json({ message: "تم النسخ التلقائي", fileName });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

async function getBackupData() {
  const [products, categories, units, invoices, customers, suppliers, purchases, expenses, returns, settings, employees, orders, notifications, branches, warehouses, productStocks, productUnits, inventoryAudits, attendance, payments, cashboxes, bankAccounts, treasuryTransactions, vouchers, employeeWithdrawals, advances, salaryPayments] = await Promise.all([
    prisma.product.findMany(),
    prisma.category.findMany(),
    prisma.unit.findMany(),
    prisma.invoice.findMany({ include: { items: true } }),
    prisma.customer.findMany(),
    prisma.supplier.findMany(),
    prisma.purchase.findMany({ include: { purchaseItems: true } }),
    prisma.expense.findMany(),
    prisma.return.findMany(),
    prisma.settings.findMany(),
    prisma.employee.findMany(),
    prisma.order.findMany(),
    prisma.notification.findMany(),
    prisma.branch.findMany(),
    prisma.warehouse.findMany(),
    prisma.productStock.findMany(),
    prisma.productUnit.findMany(),
    prisma.inventoryAudit.findMany({ include: { items: true } }),
    prisma.attendance.findMany(),
    prisma.payment.findMany(),
    prisma.cashbox.findMany(),
    prisma.bankAccount.findMany(),
    prisma.treasuryTransaction.findMany(),
    prisma.voucher.findMany(),
    prisma.employeeWithdrawal.findMany(),
    prisma.advance.findMany(),
    prisma.salaryPayment.findMany(),
  ]);

  return { products, categories, units, invoices, customers, suppliers, purchases, expenses, returns, settings, employees, orders, notifications, branches, warehouses, productStocks, productUnits, inventoryAudits, attendance, payments, cashboxes, bankAccounts, treasuryTransactions, vouchers, employeeWithdrawals, advances, salaryPayments, backupDate: new Date().toISOString(), version: "3.0" };
}