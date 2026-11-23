import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";

// جلب كل جلسات الجرد
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const audits = await prisma.inventoryAudit.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });

    return NextResponse.json(audits);
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

// فتح جلسة جرد جديدة
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const audit = await prisma.inventoryAudit.create({
      data: { name: body.name },
    });

    return NextResponse.json(audit, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}