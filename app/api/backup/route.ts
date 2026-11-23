import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const [
      products,
      categories,
      units,
      invoices,
      customers,
      suppliers,
      purchases,
      expenses,
      returns,
      settings,
      employees,
      orders,
      notifications,
      branches,
      warehouses,
      productStocks,
      productUnits,
      inventoryAudits,
      attendance,
      payments,
      cashboxes,
      bankAccounts,
      treasuryTransactions,
      vouchers,
      employeeWithdrawals,
      advances,
      salaryPayments,
      auditLogs,
    ] = await Promise.all([
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
      prisma.auditLog.findMany({ take: 1000, orderBy: { createdAt: "desc" } }),
    ]);

    const backupData = {
      products,
      categories,
      units,
      invoices,
      customers,
      suppliers,
      purchases,
      expenses,
      returns,
      settings,
      employees,
      orders,
      notifications,
      branches,
      warehouses,
      productStocks,
      productUnits,
      inventoryAudits,
      attendance,
      payments,
      cashboxes,
      bankAccounts,
      treasuryTransactions,
      vouchers,
      employeeWithdrawals,
      advances,
      salaryPayments,
      auditLogs,
      backupDate: new Date().toISOString(),
      version: "3.0",
      stats: {
        products: products.length,
        invoices: invoices.length,
        customers: customers.length,
        suppliers: suppliers.length,
        purchases: purchases.length,
        payments: payments.length,
      },
    };

    return NextResponse.json(backupData);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء النسخة الاحتياطية" }, { status: 500 });
  }
}

// POST — نسخ احتياطي تلقائي (بيتحفظ في فولدر backups)
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user || (user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // جلب البيانات (نفس GET)
    const backupData = await getBackupData();

    // حفظ في فولدر backups
    const backupsDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `backup-${timestamp}.json`;
    const filePath = path.join(backupsDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), "utf-8");

    // تحديث lastBackupAt
    await prisma.settings.update({
      where: { id: "global" },
      data: { lastBackupAt: new Date() },
    });

    // حذف النسخ القديمة (نحتفظ بآخر 10 نسخ)
    const files = fs.readdirSync(backupsDir).filter((f) => f.startsWith("backup-")).sort().reverse();
    files.slice(10).forEach((oldFile) => {
      fs.unlinkSync(path.join(backupsDir, oldFile));
    });

    return NextResponse.json({
      message: "تم إنشاء النسخة الاحتياطية",
      fileName,
      filePath,
      size: fs.statSync(filePath).size,
    });
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

  return {
    products,
    categories,
    units,
    invoices,
    customers,
    suppliers,
    purchases,
    expenses,
    returns,
    settings,
    employees,
    orders,
    notifications,
    branches,
    warehouses,
    productStocks,
    productUnits,
    inventoryAudits,
    attendance,
    payments,
    cashboxes,
    bankAccounts,
    treasuryTransactions,
    vouchers,
    employeeWithdrawals,
    advances,
    salaryPayments,
    backupDate: new Date().toISOString(),
    version: "3.0",
  };
}