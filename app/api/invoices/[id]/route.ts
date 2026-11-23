import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id: Number(resolvedParams.id) },
      include: {
        items: true,
        customer: true,
        warehouse: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "الفاتورة غير موجودة" }, { status: 404 });
    }

    return NextResponse.json(invoice);
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

    // تحديث المبلغ المدفوع فقط (للسداد الجزئي)
    if (body.paidAmount !== undefined) {
      const updated = await prisma.invoice.update({
        where: { id: Number(resolvedParams.id) },
        data: { paidAmount: Number(body.paidAmount) },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "لا يوجد حقل للتحديث" }, { status: 400 });
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
    await prisma.invoice.delete({
      where: { id: Number(resolvedParams.id) },
    });

    return NextResponse.json({ message: "تم الحذف" });
  } catch {
    return NextResponse.json({ error: "حدث خطأ أثناء الحذف" }, { status: 500 });
  }
}