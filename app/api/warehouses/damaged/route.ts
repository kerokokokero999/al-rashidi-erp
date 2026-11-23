import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";

export async function GET() {
  try {
    const damages = await prisma.damagedProduct.findMany({
      orderBy: { damageDate: "desc" },
      include: {
        product: true,
        warehouse: true,
      },
    });
    return NextResponse.json(damages);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await request.json();
    const { warehouseId, productId, quantity, unitId, unitName, factor = 1, reason, responsible } = body;

    const totalQty = Number(quantity) * (Number(factor) || 1);

    const stock = await prisma.productStock.findUnique({
      where: {
        productId_warehouseId: {
          productId: Number(productId),
          warehouseId: Number(warehouseId),
        },
      },
    });

    if (!stock || stock.stock < totalQty) {
      return NextResponse.json({ error: "الكمية غير متوفرة في المخزن" }, { status: 400 });
    }

    const damage = await prisma.damagedProduct.create({
      data: {
        warehouseId: Number(warehouseId),
        productId: Number(productId),
        quantity: Number(quantity),
        unitId: unitId ? Number(unitId) : null,
        unitName: unitName || null,
        factor: Number(factor) || 1,
        reason: reason || null,
        responsible: responsible || null,
      },
    });

    // خصم من المخزن
    await prisma.productStock.update({
      where: {
        productId_warehouseId: {
          productId: Number(productId),
          warehouseId: Number(warehouseId),
        },
      },
      data: { stock: { decrement: totalQty } },
    });

    // خصم من إجمالي المنتج
    await prisma.product.update({
      where: { id: Number(productId) },
      data: { stock: { decrement: totalQty } },
    });

    return NextResponse.json(damage, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}