import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const resolvedParams = await params;
    const attendanceId = Number(resolvedParams.id);

    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
    });

    if (!attendance) {
      return NextResponse.json({ error: "السجل غير موجود" }, { status: 404 });
    }

    if (attendance.checkOut) {
      return NextResponse.json(
        { error: "تم تسجيل الانصراف بالفعل" },
        { status: 400 }
      );
    }

    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: { checkOut: new Date() },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}