import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";

// جلب كل الوحدات
export async function GET() {
  try {
    const units = await prisma.unit.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(units);
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

// إضافة وحدة جديدة
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const unit = await prisma.unit.create({
      data: { name: body.name },
    });
    return NextResponse.json(unit, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "الاسم مسجل بالفعل" }, { status: 400 });
  }
}