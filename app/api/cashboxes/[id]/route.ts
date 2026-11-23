import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const cashbox = await prisma.cashbox.findUnique({
      where: { id: Number(resolvedParams.id) },
      include: { branch: true },
    });
    return NextResponse.json(cashbox);
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

    const cashbox = await prisma.cashbox.update({
      where: { id: Number(resolvedParams.id) },
      data: {
        name: body.name,
        branchId: body.branchId ? Number(body.branchId) : null,
        isActive: Boolean(body.isActive),
      },
    });
    return NextResponse.json(cashbox);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
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
    await prisma.cashbox.delete({
      where: { id: Number(resolvedParams.id) },
    });
    return NextResponse.json({ message: "تم الحذف" });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}