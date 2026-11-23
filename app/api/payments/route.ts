import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";
import { logActivity } from "../../../lib/audit";
import { paymentSchema, formatZodError } from "../../../lib/validations";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await request.json();

    // ✅ Validation
    const result = paymentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: formatZodError(result.error) },
        { status: 400 }
      );
    }

    const data = result.data;

    const payment = await prisma.payment.create({
      data: {
        type: data.type,
        supplierId: data.supplierId,
        customerId: data.customerId,
        purchaseId: data.purchaseId,
        invoiceId: data.invoiceId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        notes: data.notes || null,
      },
    });

    if (data.purchaseId) {
      const purchase = await prisma.purchase.findUnique({
        where: { id: data.purchaseId },
      });
      if (purchase) {
        const newPaid = purchase.paidAmount + data.amount;
        await prisma.purchase.update({
          where: { id: data.purchaseId },
          data: { paidAmount: Math.min(newPaid, purchase.total) },
        });
      }
    }

    if (data.invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: data.invoiceId },
      });
      if (invoice) {
        const newPaid = invoice.paidAmount + data.amount;
        await prisma.invoice.update({
          where: { id: data.invoiceId },
          data: { paidAmount: Math.min(newPaid, invoice.total) },
        });
      }
    }

    if (data.cashboxId) {
      const cashbox = await prisma.cashbox.findUnique({
        where: { id: data.cashboxId },
      });

      if (cashbox) {
        const isSupplierPayment = data.type === "SUPPLIER";
        const txnType = isSupplierPayment ? "WITHDRAW" : "DEPOSIT";

        if (isSupplierPayment && cashbox.balance < data.amount) {
          return NextResponse.json({ error: "رصيد الخزنة غير كافٍ" }, { status: 400 });
        }

        await prisma.cashbox.update({
          where: { id: data.cashboxId },
          data: {
            balance: isSupplierPayment
              ? { decrement: data.amount }
              : { increment: data.amount },
          },
        });

        await prisma.treasuryTransaction.create({
          data: {
            type: txnType,
            sourceType: "CASHBOX",
            sourceId: data.cashboxId,
            amount: data.amount,
            reason: `سداد ${isSupplierPayment ? "مورد" : "عميل"} - دفعة #${payment.id}`,
            responsible: user.name || user.email || null,
            referenceType: "PAYMENT",
            referenceId: payment.id,
          },
        });
      }
    }

    await logActivity({
      action: "CREATE",
      entity: "Payment",
      entityId: payment.id,
      description: `دفعة ${payment.type === "SUPPLIER" ? "لمورد" : "من عميل"} بقيمة ${payment.amount} ج.م`,
      metadata: {
        paymentId: payment.id,
        type: payment.type,
        amount: payment.amount,
        supplierId: payment.supplierId,
        customerId: payment.customerId,
        invoiceId: payment.invoiceId,
        purchaseId: payment.purchaseId,
        paymentMethod: payment.paymentMethod,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const supplierId = searchParams.get("supplierId");
    const customerId = searchParams.get("customerId");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (supplierId) where.supplierId = Number(supplierId);
    if (customerId) where.customerId = Number(customerId);

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        supplier: true,
        customer: true,
        purchase: true,
        invoice: true,
      },
    });

    return NextResponse.json(payments);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}