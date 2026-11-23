import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";

export async function GET() {
  try {
    const transfers = await prisma.warehouseTransfer.findMany({
      orderBy: { transferDate: "desc" },
      include: {
        product: { include: { unit: true } },
        fromWarehouse: true,
        toWarehouse: true,
      },
    });
    return NextResponse.json(transfers);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await request.json();
    const {
      fromWarehouseId,
      toWarehouseId,
      productId,
      quantity,
      unitId,
      unitName,
      factor = 1,
      purchasePrice = 0,
      sellPrice = 0,
      responsible,
      reason,
    } = body;

    if (fromWarehouseId === toWarehouseId) {
      return NextResponse.json({ error: "لا يمكن التحويل لنفس المخزن" }, { status: 400 });
    }

    const totalQty = Number(quantity) * (Number(factor) || 1);

    // 1. التحقق من توفر الكمية في المخزن المصدر
    const sourceStock = await prisma.productStock.findUnique({
      where: {
        productId_warehouseId: {
          productId: Number(productId),
          warehouseId: Number(fromWarehouseId),
        },
      },
    });

    if (!sourceStock || sourceStock.stock < totalQty) {
      return NextResponse.json({ error: "الكمية غير متوفرة في المخزن المصدر" }, { status: 400 });
    }

    // 2. تسجيل التحويل
    const transfer = await prisma.warehouseTransfer.create({
      data: {
        fromWarehouseId: Number(fromWarehouseId),
        toWarehouseId: Number(toWarehouseId),
        productId: Number(productId),
        quantity: Number(quantity),
        unitId: unitId ? Number(unitId) : null,
        unitName: unitName || null,
        factor: Number(factor) || 1,
        purchasePrice: Number(purchasePrice),
        sellPrice: Number(sellPrice),
        responsible: responsible || null,
        reason: reason || null,
      },
    });

    // 3. خصم من المصدر
    await prisma.productStock.update({
      where: {
        productId_warehouseId: {
          productId: Number(productId),
          warehouseId: Number(fromWarehouseId),
        },
      },
      data: { stock: { decrement: totalQty } },
    });

    // 4. إضافة للمستقبل
    await prisma.productStock.upsert({
      where: {
        productId_warehouseId: {
          productId: Number(productId),
          warehouseId: Number(toWarehouseId),
        },
      },
      create: {
        productId: Number(productId),
        warehouseId: Number(toWarehouseId),
        stock: totalQty,
        purchasePrice: Number(purchasePrice) || sourceStock.purchasePrice,
      },
      update: {
        stock: { increment: totalQty },
      },
    });

    return NextResponse.json(transfer, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ أثناء التحويل" }, { status: 500 });
  }
}