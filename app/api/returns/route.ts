import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await request.json();
    const { invoiceId, purchaseId, type = "SALE", items, total, reason } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "بيانات المرتجع غير مكتملة" }, { status: 400 });
    }

    // لو مرتجع مبيعات — لازم invoiceId
    if (type === "SALE" && !invoiceId) {
      return NextResponse.json({ error: "رقم الفاتورة مطلوب لمرتجع المبيعات" }, { status: 400 });
    }

    // لو مرتجع مشتريات — لازم purchaseId
    if (type === "PURCHASE" && !purchaseId) {
      return NextResponse.json({ error: "رقم فاتورة المشتريات مطلوب" }, { status: 400 });
    }

    // ✅ 1. التحقق من الفاتورة الأصلية
    if (type === "SALE") {
      const invoice = await prisma.invoice.findUnique({
        where: { id: Number(invoiceId) },
        include: { items: true },
      });

      if (!invoice) {
        return NextResponse.json({ error: "الفاتورة غير موجودة" }, { status: 404 });
      }

      // المرتجعات السابقة
      const previousReturns = await prisma.return.findMany({
        where: { invoiceId: Number(invoiceId), type: "SALE" },
      });

      const returnedQuantities: Record<number, number> = {};
      for (const ret of previousReturns) {
        try {
          const retItems = JSON.parse(ret.items);
          for (const item of retItems) {
            const productId = item.productId || item.id;
            if (productId) {
              returnedQuantities[productId] = (returnedQuantities[productId] || 0) + (item.quantity || 0);
            }
          }
        } catch (err) {
          console.error("Error parsing previous return items:", err);
        }
      }

      // التحقق من كل منتج
      for (const item of items) {
        const productId = item.productId || item.id;
        if (!productId || !item.quantity) {
          return NextResponse.json({
            error: `بيانات المنتج "${item.name || "غير معروف"}" غير مكتملة`,
          }, { status: 400 });
        }

        const invoiceItem = invoice.items.find((invItem) => invItem.productId === Number(productId));
        if (!invoiceItem) {
          return NextResponse.json({
            error: `المنتج "${item.name}" مش موجود في الفاتورة الأصلية`,
          }, { status: 400 });
        }

        const alreadyReturned = returnedQuantities[productId] || 0;
        const maxReturnable = invoiceItem.quantity - alreadyReturned;

        if (item.quantity > maxReturnable) {
          return NextResponse.json({
            error: `المنتج "${item.name}": الكمية المتاحة للإرجاع ${maxReturnable} بس (إنت طلبت ${item.quantity}). الكمية الأصلية: ${invoiceItem.quantity}، اللي اترجع قبل كده: ${alreadyReturned}`,
          }, { status: 400 });
        }
      }
    } else if (type === "PURCHASE") {
      const purchase = await prisma.purchase.findUnique({
        where: { id: Number(purchaseId) },
        include: { purchaseItems: true },
      });

      if (!purchase) {
        return NextResponse.json({ error: "فاتورة المشتريات غير موجودة" }, { status: 404 });
      }

      if (purchase.status !== "RECEIVED") {
        return NextResponse.json({ error: "لا يمكن إرجاع فاتورة لم يتم استلامها" }, { status: 400 });
      }

      const previousReturns = await prisma.return.findMany({
        where: { purchaseId: Number(purchaseId), type: "PURCHASE" },
      });

      const returnedQuantities: Record<number, number> = {};
      for (const ret of previousReturns) {
        try {
          const retItems = JSON.parse(ret.items);
          for (const item of retItems) {
            const productId = item.productId || item.id;
            if (productId) {
              returnedQuantities[productId] = (returnedQuantities[productId] || 0) + (item.quantity || 0);
            }
          }
        } catch (err) {
          console.error("Error parsing previous return items:", err);
        }
      }

      for (const item of items) {
        const productId = item.productId || item.id;
        if (!productId || !item.quantity) {
          return NextResponse.json({
            error: `بيانات المنتج "${item.name || "غير معروف"}" غير مكتملة`,
          }, { status: 400 });
        }

        const purchaseItem = purchase.purchaseItems.find((pi) => pi.productId === Number(productId));
        if (!purchaseItem) {
          return NextResponse.json({
            error: `المنتج "${item.name}" مش موجود في فاتورة المشتريات`,
          }, { status: 400 });
        }

        const alreadyReturned = returnedQuantities[productId] || 0;
        const maxReturnable = purchaseItem.quantity - alreadyReturned;

        if (item.quantity > maxReturnable) {
          return NextResponse.json({
            error: `المنتج "${item.name}": الكمية المتاحة للإرجاع ${maxReturnable} بس (إنت طلبت ${item.quantity})`,
          }, { status: 400 });
        }
      }
    }

    // ✅ 5. إنشاء المرتجع
    const returnRecord = await prisma.return.create({
      data: {
        invoiceId: type === "SALE" ? Number(invoiceId) : null,
        purchaseId: type === "PURCHASE" ? Number(purchaseId) : null,
        type,
        items: JSON.stringify(items),
        total: Number(total),
        reason: reason || null,
      },
    });

    // ✅ 6. تحديث المخزون
    if (type === "SALE") {
      // مرتجع مبيعات = إرجاع للمخزون (زيادة)
      for (const item of items) {
        const productId = item.productId || item.id;
        if (!productId || !item.quantity) continue;
        try {
          const updated = await prisma.product.update({
            where: { id: Number(productId) },
            data: { stock: { increment: Number(item.quantity) } },
          });
          console.log(`✅ Returned ${item.quantity} of "${updated.name}" to stock. New stock: ${updated.stock}`);
        } catch (err) {
          console.error(`❌ Error updating product ${productId}:`, err);
        }
      }
    } else if (type === "PURCHASE") {
      // مرتجع مشتريات = إخراج من المخزون (خصم)
      for (const item of items) {
        const productId = item.productId || item.id;
        if (!productId || !item.quantity) continue;
        try {
          const updated = await prisma.product.update({
            where: { id: Number(productId) },
            data: { stock: { decrement: Number(item.quantity) } },
          });
          console.log(`✅ Returned ${item.quantity} of "${updated.name}" to supplier. New stock: ${updated.stock}`);
        } catch (err) {
          console.error(`❌ Error updating product ${productId}:`, err);
        }
      }
    }

    return NextResponse.json({ message: "تم تسجيل المرتجع", return: returnRecord }, { status: 201 });
  } catch (error) {
    console.error("Return error:", error);
    return NextResponse.json({ error: "حدث خطأ في تسجيل المرتجع" }, { status: 500 });
  }
}

// ✅ GET — مع فلترة اختيارية
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoiceId");
    const purchaseId = searchParams.get("purchaseId");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};
    if (invoiceId) where.invoiceId = Number(invoiceId);
    if (purchaseId) where.purchaseId = Number(purchaseId);
    if (type) where.type = type;

    const returns = await prisma.return.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(returns);
  } catch (error) {
    console.error("Get returns error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}