import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "لم يتم اختيار ملف" }, { status: 400 });
    }

    const text = await file.text();
    const data = JSON.parse(text);

    // ⚠️ مسح البيانات الحالية (ترتيب المسح مهم عشان الـ Foreign Keys)
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

    // 4. الفروع
    await prisma.branch.deleteMany();

    // إعادة إدخال البيانات
    // 1. الأقسام والوحدات
    if (data.categories?.length) await prisma.category.createMany({ data: data.categories });
    if (data.units?.length) await prisma.unit.createMany({ data: data.units });

    // 2. الفروع
    if (data.branches?.length) await prisma.branch.createMany({ data: data.branches });

    // 3. المنتجات
    if (data.products?.length) await prisma.product.createMany({ data: data.products });

    // 4. ProductStock
    if (data.productStocks?.length) await prisma.productStock.createMany({ data: data.productStocks });

    // 5. العملاء والموردين
    if (data.customers?.length) await prisma.customer.createMany({ data: data.customers });
    if (data.suppliers?.length) await prisma.supplier.createMany({ data: data.suppliers });

    // 6. الموظفين + الحضور
    if (data.employees?.length) await prisma.employee.createMany({ data: data.employees });
    if (data.attendance?.length) await prisma.attendance.createMany({ data: data.attendance });

    // 7. الإعدادات
    if (data.settings?.length) await prisma.settings.createMany({ data: data.settings });

    // 8. الفواتير (لازم نعملها واحدة واحدة عشان نضيف الـ items)
    if (data.invoices?.length) {
      for (const inv of data.invoices) {
        const { items, ...invoiceData } = inv;
        const createdInvoice = await prisma.invoice.create({ data: invoiceData });
        if (items?.length) {
          await prisma.invoiceItem.createMany({
            data: items.map((item: Record<string, unknown>) => ({
              ...item,
              invoiceId: createdInvoice.id,
            })),
          });
        }
      }
    }

    // 9. الجرد
    if (data.inventoryAudits?.length) {
      for (const audit of data.inventoryAudits) {
        const { items, ...auditData } = audit;
        const createdAudit = await prisma.inventoryAudit.create({ data: auditData });
        if (items?.length) {
          await prisma.inventoryAuditItem.createMany({
            data: items.map((item: Record<string, unknown>) => ({
              ...item,
              auditId: createdAudit.id,
            })),
          });
        }
      }
    }

    // 10. المصروفات والمرتجعات والطلبات والإشعارات
    if (data.expenses?.length) await prisma.expense.createMany({ data: data.expenses });
    if (data.returns?.length) await prisma.return.createMany({ data: data.returns });
    if (data.orders?.length) await prisma.order.createMany({ data: data.orders });
    if (data.notifications?.length) await prisma.notification.createMany({ data: data.notifications });

    // ⚠️ المستخدمين (User, Account, Session) مش بيتم استعادتهم
    // لأنهم مش بيتأثروا بالـ reset، واستعادتهم ممكن تسبب مشاكل

    return NextResponse.json({ message: "تم استعادة النسخة الاحتياطية بنجاح" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ أثناء الاستعادة" }, { status: 500 });
  }
}