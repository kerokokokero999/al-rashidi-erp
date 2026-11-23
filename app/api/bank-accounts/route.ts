import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";

export async function GET() {
  try {
    const accounts = await prisma.bankAccount.findMany({
      orderBy: { createdAt: "asc" },
      include: { branch: true },
    });
    return NextResponse.json(accounts);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await request.json();
    const account = await prisma.bankAccount.create({
      data: {
        name: body.name,
        bankName: body.bankName || null,
        accountNumber: body.accountNumber || null,
        branchId: body.branchId ? Number(body.branchId) : null,
        balance: Number(body.balance) || 0,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
    });
    return NextResponse.json(account, { status: 201 });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}