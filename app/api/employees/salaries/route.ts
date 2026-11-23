import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");

    const where: Record<string, unknown> = {};
    if (employeeId && employeeId !== "all") where.employeeId = Number(employeeId);

    const salaries = await prisma.salaryPayment.findMany({
      where,
      orderBy: { payDate: "desc" },
      include: { employee: true },
    });

    return NextResponse.json(salaries);
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
      employeeId,
      salary,
      advancesDeducted = 0,
      withdrawalsDeducted = 0,
      payDate,
      dueDate,
      notes,
    } = body;

    if (!employeeId || !salary) {
      return NextResponse.json({ error: "البيانات ناقصة" }, { status: 400 });
    }

    const netSalary = Number(salary) - Number(advancesDeducted) - Number(withdrawalsDeducted);

    const salaryPayment = await prisma.salaryPayment.create({
      data: {
        employeeId: Number(employeeId),
        salary: Number(salary),
        advancesDeducted: Number(advancesDeducted),
        withdrawalsDeducted: Number(withdrawalsDeducted),
        netSalary,
        payDate: payDate ? new Date(payDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
      },
    });

    // خصم السلف من السلفيات المفتوحة (تلقائيًا)
    if (Number(advancesDeducted) > 0) {
      let remainingToDeduct = Number(advancesDeducted);
      const openAdvances = await prisma.advance.findMany({
        where: {
          employeeId: Number(employeeId),
          personType: "EMPLOYEE",
        },
        orderBy: { advanceDate: "asc" },
      });

      for (const adv of openAdvances) {
        if (remainingToDeduct <= 0) break;
        const remaining = adv.amount - adv.paidAmount;
        if (remaining <= 0) continue;

        const deduct = Math.min(remaining, remainingToDeduct);
        await prisma.advance.update({
          where: { id: adv.id },
          data: { paidAmount: adv.paidAmount + deduct },
        });
        remainingToDeduct -= deduct;
      }
    }

    return NextResponse.json(salaryPayment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}