import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";

export async function GET() {
  try {
    const cashboxes = await prisma.cashbox.findMany({
      orderBy: { createdAt: "asc" },
      include: { branch: true },
    });
    return NextResponse.json(cashboxes);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await request.json();
    const cashbox = await prisma.cashbox.create({
      data: {
        name: body.name,
        branchId: body.branchId ? Number(body.branchId) : null,
        balance: Number(body.balance) || 0,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
    });
    return NextResponse.json(cashbox, { status: 201 });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}