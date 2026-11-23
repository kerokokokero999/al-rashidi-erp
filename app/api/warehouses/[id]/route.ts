import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: Number(resolvedParams.id) },
      include: {
        branch: true,
        productStocks: { include: { product: true } },
      },
    });
    return NextResponse.json(warehouse);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
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

    const warehouse = await prisma.warehouse.update({
      where: { id: Number(resolvedParams.id) },
      data: {
        name: body.name,
        branchId: Number(body.branchId),
        isActive: Boolean(body.isActive),
      },
      include: { branch: true },
    });
    return NextResponse.json(warehouse);
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
    await prisma.warehouse.delete({
      where: { id: Number(resolvedParams.id) },
    });
    return NextResponse.json({ message: "تم الحذف" });
  } catch {
    return NextResponse.json({ error: "حدث خطأ أثناء الحذف" }, { status: 500 });
  }
}