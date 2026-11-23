import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";
import { logActivity } from "../../../../lib/audit";
import { productSchema, formatZodError } from "../../../../lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const product = await prisma.product.findUnique({
    where: { id: Number(resolvedParams.id) },
    include: {
      productUnits: true,
      productStocks: { include: { warehouse: true } },
      category: true,
      unit: true,
    },
  });
  return NextResponse.json(product);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const resolvedParams = await params;
    const body = await request.json();

    // ✅ Validation
    const result = productSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: formatZodError(result.error) },
        { status: 400 }
      );
    }

    const data = result.data;

    const updatedProduct = await prisma.product.update({
      where: { id: Number(resolvedParams.id) },
      data: {
        name: data.name,
        barcode: data.barcode || null,
        categoryId: data.categoryId || null,
        unitId: data.unitId || null,
        costPrice: data.costPrice,
        sellPrice: data.sellPrice,
        stock: data.stock,
        minStock: data.minStock,
        supplier: data.supplier || null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        image: data.image || null,
        productStocks: {
          deleteMany: {},
          create: data.warehouseStocks.map((ws) => ({
            warehouseId: ws.warehouseId,
            stock: ws.stock,
            purchasePrice: ws.purchasePrice || data.costPrice || 0,
          })),
        },
        productUnits: {
          deleteMany: {},
          create: data.productUnits.map((u) => ({
            name: u.name,
            factor: u.factor,
            price: u.price,
            barcode: u.barcode || null,
            isBase: u.isBase,
          })),
        },
      },
      include: { productUnits: true, productStocks: true },
    });

    await logActivity({
      action: "UPDATE",
      entity: "Product",
      entityId: updatedProduct.id,
      description: `تعديل منتج: ${updatedProduct.name}`,
      metadata: { name: updatedProduct.name, sellPrice: updatedProduct.sellPrice },
    });

    return NextResponse.json(updatedProduct);
  } catch {
    return NextResponse.json({ error: "حدث خطأ أثناء التعديل" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const resolvedParams = await params;

    const product = await prisma.product.findUnique({
      where: { id: Number(resolvedParams.id) },
      select: { name: true },
    });

    await prisma.product.delete({ where: { id: Number(resolvedParams.id) } });

    await logActivity({
      action: "DELETE",
      entity: "Product",
      entityId: Number(resolvedParams.id),
      description: `حذف منتج: ${product?.name || `#${resolvedParams.id}`}`,
    });

    return NextResponse.json({ message: "تم الحذف" });
  } catch {
    return NextResponse.json({ error: "حدث خطأ أثناء الحذف" }, { status: 500 });
  }
}