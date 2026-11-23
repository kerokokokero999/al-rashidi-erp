import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");

    const where: Record<string, unknown> = {};
    if (employeeId && employeeId !== "all") where.employeeId = Number(employeeId);

    const withdrawals = await prisma.employeeWithdrawal.findMany({
      where,
      orderBy: { withdrawalDate: "desc" },
      include: {
        employee: true,
        product: true,
        warehouse: true,
      },
    });

    return NextResponse.json(withdrawals);
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
      employeeId,
      productId,
      warehouseId,
      quantity,
      unitId,
      unitName,
      factor = 1,
      price,
      notes,
    } = body;

    if (!employeeId || !productId || !quantity) {
      return NextResponse.json({ error: "البيانات ناقصة" }, { status: 400 });
    }

    const totalQty = Number(quantity) * (Number(factor) || 1);

    // التحقق من المخزون
    if (warehouseId) {
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
    }

    // إنشاء المسحوب
    const withdrawal = await prisma.employeeWithdrawal.create({
      data: {
        employeeId: Number(employeeId),
        productId: Number(productId),
        warehouseId: warehouseId ? Number(warehouseId) : null,
        quantity: Number(quantity),
        unitId: unitId ? Number(unitId) : null,
        unitName: unitName || null,
        factor: Number(factor) || 1,
        price: Number(price),
        total: Number(price) * Number(quantity),
        notes: notes || null,
      },
    });

    // خصم من المخزون
    if (warehouseId) {
      await prisma.productStock.update({
        where: {
          productId_warehouseId: {
            productId: Number(productId),
            warehouseId: Number(warehouseId),
          },
        },
        data: { stock: { decrement: totalQty } },
      });
    }

    await prisma.product.update({
      where: { id: Number(productId) },
      data: { stock: { decrement: totalQty } },
    });

    return NextResponse.json(withdrawal, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}