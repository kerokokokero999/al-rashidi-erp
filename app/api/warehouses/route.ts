import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";

export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: { createdAt: "asc" },
      include: { branch: true },
    });
    return NextResponse.json(warehouses);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await request.json();
    const warehouse = await prisma.warehouse.create({
      data: {
        name: body.name,
        branchId: Number(body.branchId),
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
      include: { branch: true },
    });
    return NextResponse.json(warehouse, { status: 201 });
  } catch {
    return NextResponse.json({ error: "حدث خطأ أثناء الإضافة" }, { status: 500 });
  }
}