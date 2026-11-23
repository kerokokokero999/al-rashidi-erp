import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};
    if (employeeId && employeeId !== "all") where.employeeId = Number(employeeId);
    if (from || to) {
      where.withdrawalDate = {};
      if (from) (where.withdrawalDate as Record<string, unknown>).gte = new Date(from);
      if (to) (where.withdrawalDate as Record<string, unknown>).lte = new Date(to + "T23:59:59");
    }

    const withdrawals = await prisma.employeeWithdrawal.findMany({
      where,
      orderBy: { withdrawalDate: "desc" },
      include: { employee: true, product: true },
    });

    return NextResponse.json(withdrawals);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}