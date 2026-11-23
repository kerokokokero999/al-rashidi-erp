import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};
    if (employeeId && employeeId !== "all") where.employeeId = Number(employeeId);
    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to + "T23:59:59");
    }

    const attendances = await prisma.attendance.findMany({
      where,
      orderBy: { checkIn: "desc" },
      include: { employee: true },
    });

    return NextResponse.json(attendances);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await request.json();
    const { employeeId } = body;

    if (!employeeId) {
      return NextResponse.json({ error: "الموظف مطلوب" }, { status: 400 });
    }

    // التحقق من عدم وجود حضور مفتوح
    const openAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: Number(employeeId),
        checkOut: null,
      },
    });

    if (openAttendance) {
      return NextResponse.json(
        { error: "الموظف مسجل حضور بالفعل" },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId: Number(employeeId),
        checkIn: new Date(),
        date: new Date(),
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}