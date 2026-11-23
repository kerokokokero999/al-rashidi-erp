import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";
import { createNotification } from "../../../lib/notifications";
import { logActivity } from "../../../lib/audit";
import { invoiceSchema, formatZodError } from "../../../lib/validations";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await request.json();

    // ✅ Validation
    const result = invoiceSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: formatZodError(result.error) },
        { status: 400 }
      );
    }

    const data = result.data;
    const { items } = data;

    // ✅ التحقق من المخزون قبل الإنشاء
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true, stock: true },
      });

      if (!product) {
        return NextResponse.json(
          { error: `المنتج غير موجود` },
          { status: 400 }
        );
      }

      const qty = item.quantity * (item.factor || 1);
      if (product.stock < qty) {
        return NextResponse.json(
          {
            error: `الكمية المتوفرة من "${product.name}" غير كافية. المتوفر: ${product.stock}، المطلوب: ${qty}`,
          },
          { status: 400 }
        );
      }
    }

    const invoice = await prisma.invoice.create({
      data: {
        subTotal: data.subTotal,
        discount: data.discount,
        tax: data.tax,
        total: data.total,
        paymentMethod: data.paymentMethod,
        paidAmount: data.paymentMethod === "CASH" ? data.total : data.paidAmount,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        customerId: data.customerId,
        warehouseId: data.warehouseId,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            sellPrice: item.sellPrice,
            unitId: item.unitId || null,
            unitName: item.unitName || null,
            factor: item.factor || 1,
          })),
        },
      },
      include: { items: true, customer: true },
    });

    for (const item of items) {
      const qty = item.quantity * (item.factor || 1);

      const product = await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: qty } },
      });

      if (data.warehouseId) {
        await prisma.productStock.upsert({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: data.warehouseId,
            },
          },
          create: { productId: item.productId, warehouseId: data.warehouseId, stock: 0 },
          update: { stock: { decrement: qty } },
        });
      }

      if (product.stock <= product.minStock) {
        await createNotification({
          title: "منتج قارب على النفاد",
          message: `${product.name} متبقي منه ${product.stock}`,
          type: "LOW_STOCK",
          link: "/products",
        });
      }
    }

    if (data.cashboxId && data.paymentMethod === "CASH") {
      const cashbox = await prisma.cashbox.findUnique({
        where: { id: data.cashboxId },
      });

      if (cashbox) {
        await prisma.cashbox.update({
          where: { id: data.cashboxId },
          data: { balance: { increment: data.total } },
        });

        await prisma.treasuryTransaction.create({
          data: {
            type: "DEPOSIT",
            sourceType: "CASHBOX",
            sourceId: data.cashboxId,
            amount: data.total,
            reason: `فاتورة مبيعات #${invoice.id}`,
            responsible: user.name || user.email || null,
            referenceType: "SALE",
            referenceId: invoice.id,
          },
        });
      }
    }

    await logActivity({
      action: "CREATE",
      entity: "Invoice",
      entityId: invoice.id,
      description: `فاتورة مبيعات #${invoice.id} بقيمة ${invoice.total} ج.م`,
      metadata: {
        invoiceId: invoice.id,
        total: invoice.total,
        customerId: invoice.customerId,
        paymentMethod: invoice.paymentMethod,
        itemsCount: invoice.items.length,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        customer: true,
        warehouse: true,
      },
    });
    return NextResponse.json(invoices);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}