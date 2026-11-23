import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get("supplierId");

    const where: Record<string, unknown> = {
      paymentMethod: "CREDIT",
      status: "RECEIVED", // بس المشتريات المستلمة
    };
    if (supplierId && supplierId !== "all") {
      where.supplierId = Number(supplierId);
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: { supplier: true },
      orderBy: { createdAt: "desc" },
    });

    // فلترة اللي لسه فيها متبقي
    const pending = purchases
      .filter((p) => p.paidAmount < p.total)
      .map((p) => ({
        id: p.id,
        invoiceNumber: p.id,
        supplierId: p.supplierId,
        supplierName: p.supplier?.name || "—",
        total: p.total,
        paidAmount: p.paidAmount,
        remaining: p.total - p.paidAmount,
        createdAt: p.createdAt,
        dueDate: p.dueDate,
      }));

    return NextResponse.json(pending);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}