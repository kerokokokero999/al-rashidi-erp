import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const purchase = await prisma.purchase.findUnique({
      where: { id: Number(resolvedParams.id) },
      include: {
        supplier: true,
        purchaseItems: {
          include: { product: true, warehouse: true },
        },
      },
    });
    return NextResponse.json(purchase);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const resolvedParams = await params;
    const body = await request.json();
    const purchaseId = Number(resolvedParams.id);

    // جلب الفاتورة الحالية
    const existing = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { purchaseItems: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "الفاتورة غير موجودة" }, { status: 404 });
    }

    const newStatus = body.status;

    // لو بنستلم الفاتورة، نحدّث المخزون
    if (newStatus === "RECEIVED" && existing.status !== "RECEIVED") {
      for (const item of existing.purchaseItems) {
        const qty = item.quantity * (item.factor || 1);

        await prisma.productStock.upsert({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: item.warehouseId,
            },
          },
          create: {
            productId: item.productId,
            warehouseId: item.warehouseId,
            stock: qty,
            purchasePrice: item.costPrice,
          },
          update: {
            stock: { increment: qty },
            purchasePrice: item.costPrice,
          },
        });

        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: qty } },
        });
      }
    }

    const updated = await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        status: newStatus,
        ...(body.paidAmount !== undefined && { paidAmount: Number(body.paidAmount) }),
      },
      include: { supplier: true, purchaseItems: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ أثناء التعديل" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const resolvedParams = await params;
    const purchaseId = Number(resolvedParams.id);

    // نتحقق إن الفاتورة معلقة (مش مستلمة) قبل الحذف
    const existing = await prisma.purchase.findUnique({
      where: { id: purchaseId },
    });

    if (!existing) {
      return NextResponse.json({ error: "الفاتورة غير موجودة" }, { status: 404 });
    }

    if (existing.status === "RECEIVED") {
      return NextResponse.json(
        { error: "لا يمكن حذف فاتورة تم استلامها. يمكنك إرجاع المنتجات بدلاً من ذلك." },
        { status: 400 }
      );
    }

    await prisma.purchase.delete({
      where: { id: purchaseId },
    });

    return NextResponse.json({ message: "تم الحذف" });
  } catch {
    return NextResponse.json({ error: "حدث خطأ أثناء الحذف" }, { status: 500 });
  }
}