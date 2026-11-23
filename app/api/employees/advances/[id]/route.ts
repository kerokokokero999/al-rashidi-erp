import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const resolvedParams = await params;
    const body = await request.json();
    const { paidAmount } = body;

    if (!paidAmount || paidAmount <= 0) {
      return NextResponse.json({ error: "المبلغ غير صحيح" }, { status: 400 });
    }

    const advance = await prisma.advance.findUnique({
      where: { id: Number(resolvedParams.id) },
    });

    if (!advance) {
      return NextResponse.json({ error: "السلفة غير موجودة" }, { status: 404 });
    }

    const newPaid = advance.paidAmount + Number(paidAmount);
    const updated = await prisma.advance.update({
      where: { id: Number(resolvedParams.id) },
      data: { paidAmount: Math.min(newPaid, advance.amount) },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
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
    await prisma.advance.delete({
      where: { id: Number(resolvedParams.id) },
    });

    return NextResponse.json({ message: "تم الحذف" });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}