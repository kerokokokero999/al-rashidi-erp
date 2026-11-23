import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // DEPOSIT | WITHDRAW | TRANSFER
    const sourceType = searchParams.get("sourceType"); // CASHBOX | BANK
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};
    if (type && type !== "ALL") where.type = type;
    if (sourceType && sourceType !== "ALL") where.sourceType = sourceType;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to + "T23:59:59");
    }

    const transactions = await prisma.treasuryTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // جلب أسماء الخزائن والبنوك
    const [cashboxes, bankAccounts] = await Promise.all([
      prisma.cashbox.findMany({ select: { id: true, name: true } }),
      prisma.bankAccount.findMany({ select: { id: true, name: true } }),
    ]);

    return NextResponse.json({
      transactions,
      cashboxes,
      bankAccounts,
    });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}