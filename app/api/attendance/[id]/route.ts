import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";

// تسجيل انصراف (Check-Out)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const resolvedParams = await params;
    const attendance = await prisma.attendance.update({
      where: { id: Number(resolvedParams.id) },
      data: { checkOut: new Date() },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}