import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";

// جلب كل الفروع
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const branches = await prisma.branch.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(branches);
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

// إضافة فرع جديد
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const branch = await prisma.branch.create({
      data: {
        name: body.name,
        address: body.address || null,
        phone: body.phone || null,
      },
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "الاسم مسجل بالفعل" }, { status: 400 });
  }
}