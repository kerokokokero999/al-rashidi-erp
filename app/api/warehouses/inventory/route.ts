import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId");
    const barcode = searchParams.get("barcode");

    const where: Record<string, unknown> = {};

    if (warehouseId && warehouseId !== "all") {
      where.warehouseId = Number(warehouseId);
    }

    if (barcode) {
      where.product = { barcode: { contains: barcode } };
    }

    const stocks = await prisma.productStock.findMany({
      where,
      include: {
        product: {
          include: { unit: true, category: true },
        },
        warehouse: {
          include: { branch: true },
        },
      },
      orderBy: { product: { name: "asc" } },
    });

    return NextResponse.json(stocks);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}