import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const paid = searchParams.get("paid"); // true | false

    const where: Record<string, unknown> = {};
    if (employeeId && employeeId !== "all") where.employeeId = Number(employeeId);

    const advances = await prisma.advance.findMany({
      where,
      orderBy: { advanceDate: "desc" },
      include: { employee: true },
    });

    // فلترة (مدفوع/غير مدفوع)
    const filtered = paid === "true"
      ? advances.filter((a) => a.paidAmount >= a.amount)
      : paid === "false"
      ? advances.filter((a) => a.paidAmount < a.amount)
      : advances;

    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await request.json();
    const {
      personType, // EMPLOYEE | PERSON
      employeeId,
      personName,
      amount,
      advanceDate,
      dueDate,
      notes,
    } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "المبلغ غير صحيح" }, { status: 400 });
    }

    if (personType === "EMPLOYEE" && !employeeId) {
      return NextResponse.json({ error: "اختر الموظف" }, { status: 400 });
    }

    if (personType === "PERSON" && !personName) {
      return NextResponse.json({ error: "اسم الشخص مطلوب" }, { status: 400 });
    }

    const advance = await prisma.advance.create({
      data: {
        personType,
        employeeId: personType === "EMPLOYEE" ? Number(employeeId) : null,
        personName: personType === "PERSON" ? personName : null,
        amount: Number(amount),
        advanceDate: advanceDate ? new Date(advanceDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
      },
    });

    return NextResponse.json(advance, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}