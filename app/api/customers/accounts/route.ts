import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    const where: Record<string, unknown> = {
      paymentMethod: "CREDIT",
    };
    if (customerId && customerId !== "all") {
      where.customerId = Number(customerId);
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    });

    const pending = invoices
      .filter((inv) => inv.paidAmount < inv.total)
      .map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.id,
        customerId: inv.customerId,
        customerName: inv.customer?.name || "عميل نقدي",
        total: inv.total,
        paidAmount: inv.paidAmount,
        remaining: inv.total - inv.paidAmount,
        createdAt: inv.createdAt,
        dueDate: inv.dueDate,
      }));

    return NextResponse.json(pending);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}