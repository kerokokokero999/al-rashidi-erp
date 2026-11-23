import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";
import { logActivity } from "../../../lib/audit";
import { voucherSchema, formatZodError } from "../../../lib/validations";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};
    if (type && type !== "ALL") where.type = type;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to + "T23:59:59");
    }

    const vouchers = await prisma.voucher.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        cashbox: true,
        bankAccount: true,
      },
    });

    return NextResponse.json(vouchers);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await request.json();

    // ✅ Validation
    const result = voucherSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: formatZodError(result.error) },
        { status: 400 }
      );
    }

    const data = result.data;

    if (data.type === "PAYMENT") {
      if (data.cashboxId) {
        const cb = await prisma.cashbox.findUnique({ where: { id: data.cashboxId } });
        if (!cb || cb.balance < data.amount) {
          return NextResponse.json({ error: "رصيد الخزنة غير كافٍ" }, { status: 400 });
        }
      } else if (data.bankAccountId) {
        const bank = await prisma.bankAccount.findUnique({ where: { id: data.bankAccountId } });
        if (!bank || bank.balance < data.amount) {
          return NextResponse.json({ error: "رصيد البنك غير كافٍ" }, { status: 400 });
        }
      }
    }

    const lastVoucher = await prisma.voucher.findFirst({
      orderBy: { voucherNumber: "desc" },
      select: { voucherNumber: true },
    });
    const nextNumber = lastVoucher ? lastVoucher.voucherNumber + 1 : 1;

    const voucher = await prisma.voucher.create({
      data: {
        voucherNumber: nextNumber,
        type: data.type,
        amount: data.amount,
        partyName: data.partyName,
        reason: data.reason || null,
        responsible: data.responsible || null,
        cashboxId: data.cashboxId || null,
        bankAccountId: data.bankAccountId || null,
      },
      include: { cashbox: true, bankAccount: true },
    });

    if (data.cashboxId || data.bankAccountId) {
      const isCashbox = !!data.cashboxId;
      const id = isCashbox ? data.cashboxId! : data.bankAccountId!;

      if (isCashbox) {
        await prisma.cashbox.update({
          where: { id },
          data: {
            balance: {
              [data.type === "RECEIPT" ? "increment" : "decrement"]: data.amount,
            },
          },
        });
      } else {
        await prisma.bankAccount.update({
          where: { id },
          data: {
            balance: {
              [data.type === "RECEIPT" ? "increment" : "decrement"]: data.amount,
            },
          },
        });
      }

      await prisma.treasuryTransaction.create({
        data: {
          type: data.type === "RECEIPT" ? "DEPOSIT" : "WITHDRAW",
          sourceType: isCashbox ? "CASHBOX" : "BANK",
          sourceId: id,
          amount: data.amount,
          reason: `سند ${data.type === "RECEIPT" ? "قبض" : "صرف"} - ${data.partyName}`,
          responsible: data.responsible || null,
          referenceType: "VOUCHER",
          referenceId: voucher.id,
        },
      });
    }

    await logActivity({
      action: "CREATE",
      entity: "Voucher",
      entityId: voucher.id,
      description: `سند ${voucher.type === "RECEIPT" ? "قبض" : "صرف"} #${voucher.voucherNumber} بقيمة ${voucher.amount} ج.م - ${voucher.partyName}`,
      metadata: {
        voucherId: voucher.id,
        voucherNumber: voucher.voucherNumber,
        type: voucher.type,
        amount: voucher.amount,
        partyName: voucher.partyName,
        cashboxId: voucher.cashboxId,
        bankAccountId: voucher.bankAccountId,
      },
    });

    return NextResponse.json(voucher, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}