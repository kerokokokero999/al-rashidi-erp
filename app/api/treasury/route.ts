import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";

// GET — كل الحركات
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to + "T23:59:59");
    }

    const transactions = await prisma.treasuryTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(transactions);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

// POST — إيداع أو سحب أو تحويل
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await request.json();
    const {
      type, // DEPOSIT | WITHDRAW | TRANSFER
      sourceType, // CASHBOX | BANK
      sourceId,
      destType,
      destId,
      amount,
      reason,
      responsible,
    } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "المبلغ غير صحيح" }, { status: 400 });
    }

    // 1. التحقق من الرصيد الكافي (للسحب والتحويل)
    if (type === "WITHDRAW" || type === "TRANSFER") {
      if (sourceType === "CASHBOX") {
        const source = await prisma.cashbox.findUnique({ where: { id: Number(sourceId) } });
        if (!source || source.balance < amount) {
          return NextResponse.json({ error: "رصيد الخزنة غير كافٍ" }, { status: 400 });
        }
      } else {
        const source = await prisma.bankAccount.findUnique({ where: { id: Number(sourceId) } });
        if (!source || source.balance < amount) {
          return NextResponse.json({ error: "رصيد البنك غير كافٍ" }, { status: 400 });
        }
      }
    }

    // 2. تسجيل الحركة
    const transaction = await prisma.treasuryTransaction.create({
      data: {
        type,
        sourceType,
        sourceId: Number(sourceId),
        destType: destType || null,
        destId: destId ? Number(destId) : null,
        amount: Number(amount),
        reason: reason || null,
        responsible: responsible || null,
      },
    });

    // 3. تحديث الأرصدة
    if (type === "DEPOSIT") {
      // إيداع = زيادة الرصيد
      if (sourceType === "CASHBOX") {
        await prisma.cashbox.update({
          where: { id: Number(sourceId) },
          data: { balance: { increment: Number(amount) } },
        });
      } else {
        await prisma.bankAccount.update({
          where: { id: Number(sourceId) },
          data: { balance: { increment: Number(amount) } },
        });
      }
    } else if (type === "WITHDRAW") {
      // سحب = خصم الرصيد
      if (sourceType === "CASHBOX") {
        await prisma.cashbox.update({
          where: { id: Number(sourceId) },
          data: { balance: { decrement: Number(amount) } },
        });
      } else {
        await prisma.bankAccount.update({
          where: { id: Number(sourceId) },
          data: { balance: { decrement: Number(amount) } },
        });
      }
    } else if (type === "TRANSFER") {
      // تحويل = خصم من المصدر + إضافة للمستقبل
      if (sourceType === "CASHBOX") {
        await prisma.cashbox.update({
          where: { id: Number(sourceId) },
          data: { balance: { decrement: Number(amount) } },
        });
      } else {
        await prisma.bankAccount.update({
          where: { id: Number(sourceId) },
          data: { balance: { decrement: Number(amount) } },
        });
      }

      if (destType === "CASHBOX") {
        await prisma.cashbox.update({
          where: { id: Number(destId) },
          data: { balance: { increment: Number(amount) } },
        });
      } else {
        await prisma.bankAccount.update({
          where: { id: Number(destId) },
          data: { balance: { increment: Number(amount) } },
        });
      }
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}