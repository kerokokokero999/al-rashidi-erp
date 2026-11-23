import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const supplierId = searchParams.get("supplierId");
    const customerId = searchParams.get("customerId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (supplierId) where.supplierId = Number(supplierId);
    if (customerId) where.customerId = Number(customerId);
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to + "T23:59:59");
    }

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