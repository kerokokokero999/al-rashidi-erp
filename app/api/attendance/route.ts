import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";

// جلب كل سجلات الحضور
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const attendances = await prisma.attendance.findMany({
      orderBy: { checkIn: "desc" },
      include: { employee: true },
    });

    return NextResponse.json(attendances);
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

// تسجيل حضور (Check-In)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const { employeeId } = body;

    // تأكد إن الموظف مسجل حضور بالفعل النهاردة
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: Number(employeeId),
        checkIn: { gte: today },
        checkOut: null, // لسه مسجلش انصراف
      },
    });

    if (existingAttendance) {
      return NextResponse.json({ error: "الموظف مسجل حضور بالفعل" }, { status: 400 });
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId: Number(employeeId),
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}