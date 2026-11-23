import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user || (user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // ⚠️ ترتيب المسح مهم (من الأبناء للأباء)
    // 1. الجداول اللي فيها Foreign Keys
    await prisma.invoiceItem.deleteMany();
    await prisma.inventoryAuditItem.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.productStock.deleteMany();

    // 2. الجداول الرئيسية
    await prisma.invoice.deleteMany();
    await prisma.return.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.purchase.deleteMany();
    await prisma.order.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.inventoryAudit.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.employee.deleteMany();

    // 3. المنتجات والأقسام
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.unit.deleteMany();
    await prisma.settings.deleteMany();

    // 4. الفروع (بعد ما مسحنا اللي بيرتبط بيها)
    await prisma.branch.deleteMany();

    // ⚠️ المستخدمين (User, Account, Session) مش بيتمسحوا

    return NextResponse.json({ message: "تم مسح البيانات بنجاح (ماعدا المستخدمين)" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ أثناء مسح البيانات" }, { status: 500 });
  }
}