import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const voucher = await prisma.voucher.findUnique({
      where: { id: Number(resolvedParams.id) },
      include: { cashbox: true, bankAccount: true },
    });
    return NextResponse.json(voucher);
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
    const voucherId = Number(resolvedParams.id);

    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId },
    });

    if (!voucher) {
      return NextResponse.json({ error: "السند غير موجود" }, { status: 404 });
    }

    // عكس الرصيد (لو مرتبط بخزنة/بنك)
    if (voucher.cashboxId) {
      await prisma.cashbox.update({
        where: { id: voucher.cashboxId },
        data: {
          balance: {
            [voucher.type === "RECEIPT" ? "decrement" : "increment"]: voucher.amount,
          },
        },
      });
    } else if (voucher.bankAccountId) {
      await prisma.bankAccount.update({
        where: { id: voucher.bankAccountId },
        data: {
          balance: {
            [voucher.type === "RECEIPT" ? "decrement" : "increment"]: voucher.amount,
          },
        },
      });
    }

    await prisma.voucher.delete({ where: { id: voucherId } });

    return NextResponse.json({ message: "تم الحذف" });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}