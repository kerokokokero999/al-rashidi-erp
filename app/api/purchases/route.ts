import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";
import { createNotification } from "../../../lib/notifications";
import { logActivity } from "../../../lib/audit";
import { purchaseSchema, formatZodError } from "../../../lib/validations";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await request.json();

    // ✅ Validation
    const result = purchaseSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: formatZodError(result.error) },
        { status: 400 }
      );
    }

    const data = result.data;
    const { items } = data;

    const purchase = await prisma.purchase.create({
      data: {
        total: data.total,
        status: data.status,
        paymentMethod: data.paymentMethod,
        paidAmount: data.paymentMethod === "CASH" ? data.total : data.paidAmount,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        supplierId: data.supplierId,
        purchaseItems: {
          create: items.map((item) => ({
            productId: item.productId,
            warehouseId: item.warehouseId,
            name: item.name,
            quantity: item.quantity,
            unitId: item.unitId || null,
            unitName: item.unitName || null,
            factor: item.factor || 1,
            costPrice: item.costPrice,
            tax: item.tax || 0,
            discount: item.discount || 0,
            total: item.total,
          })),
        },
      },
      include: { purchaseItems: true, supplier: true },
    });

    await createNotification({
      title: "طلب شراء جديد",
      message: `طلب شراء بقيمة ${data.total} ج.م${data.status === "RECEIVED" ? " (تم الاستلام)" : " (معلق)"}`,
      type: "PURCHASE",
      link: data.status === "RECEIVED" ? "/purchases/log" : "/purchases/manage",
    });

    if (data.status === "RECEIVED") {
      for (const item of items) {
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

    if (data.cashboxId && data.paymentMethod === "CASH" && data.status === "RECEIVED") {
      const cashbox = await prisma.cashbox.findUnique({
        where: { id: data.cashboxId },
      });

      if (cashbox && cashbox.balance >= data.total) {
        await prisma.cashbox.update({
          where: { id: data.cashboxId },
          data: { balance: { decrement: data.total } },
        });

        await prisma.treasuryTransaction.create({
          data: {
            type: "WITHDRAW",
            sourceType: "CASHBOX",
            sourceId: data.cashboxId,
            amount: data.total,
            reason: `فاتورة مشتريات #${purchase.id}`,
            responsible: user.name || user.email || null,
            referenceType: "PURCHASE",
            referenceId: purchase.id,
          },
        });
      }
    }

    await logActivity({
      action: "CREATE",
      entity: "Purchase",
      entityId: purchase.id,
      description: `فاتورة مشتريات #${purchase.id} بقيمة ${purchase.total} ج.م${data.status === "RECEIVED" ? " (تم الاستلام)" : " (معلق)"}`,
      metadata: {
        purchaseId: purchase.id,
        total: purchase.total,
        status: data.status,
        supplierId: purchase.supplierId,
        paymentMethod: data.paymentMethod,
        itemsCount: purchase.purchaseItems.length,
      },
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const purchases = await prisma.purchase.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        supplier: true,
        purchaseItems: {
          include: { product: true, warehouse: true },
        },
      },
    });
    return NextResponse.json(purchases);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}