import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";

// جلب جلسة معينة مع تفاصيلها
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const audit = await prisma.inventoryAudit.findUnique({
      where: { id: Number(resolvedParams.id) },
      include: {
        items: {
          include: { product: true },
        },
      },
    });
    return NextResponse.json(audit);
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

// حفظ الكميات الفعلية (جلسة الجرد)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    const { items } = body; // [{ productId, actualQty }]

    // مسح العناصر القديمة (لو موجودة) عشان منكررش
    await prisma.inventoryAuditItem.deleteMany({
      where: { auditId: Number(resolvedParams.id) },
    });

    // إضافة العناصر الجديدة مع حساب الفرق
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (product) {
        await prisma.inventoryAuditItem.create({
          data: {
            auditId: Number(resolvedParams.id),
            productId: item.productId,
            expectedQty: product.stock,
            actualQty: item.actualQty,
            difference: item.actualQty - product.stock,
          },
        });
      }
    }

    return NextResponse.json({ message: "تم حفظ الجرد" });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

// إغلاق الجلسة وتحديث المخزون
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const resolvedParams = await params;

    // جلب الجلسة مع العناصر
    const audit = await prisma.inventoryAudit.findUnique({
      where: { id: Number(resolvedParams.id) },
      include: { items: true },
    });

    if (!audit) return NextResponse.json({ error: "الجلسة غير موجودة" }, { status: 404 });
    if (audit.status === "CLOSED") return NextResponse.json({ error: "الجلسة مغلقة بالفعل" }, { status: 400 });

    // تحديث المخزون بالكميات الفعلية
    for (const item of audit.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: item.actualQty },
      });
    }

    // إغلاق الجلسة
    await prisma.inventoryAudit.update({
      where: { id: Number(resolvedParams.id) },
      data: { status: "CLOSED", closedAt: new Date() },
    });

    return NextResponse.json({ message: "تم إغلاق الجلسة وتحديث المخزون" });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}