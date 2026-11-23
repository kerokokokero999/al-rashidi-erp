import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";
import { logActivity } from "../../../lib/audit";
import { expenseSchema, formatZodError } from "../../../lib/validations";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await request.json();

    // ✅ Validation
    const result = expenseSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: formatZodError(result.error) },
        { status: 400 }
      );
    }

    const data = result.data;

    const expense = await prisma.expense.create({
      data: { title: data.title, amount: data.amount },
    });

    if (data.cashboxId) {
      const cashbox = await prisma.cashbox.findUnique({
        where: { id: data.cashboxId },
      });

      if (cashbox) {
        if (cashbox.balance < data.amount) {
          return NextResponse.json({ error: "رصيد الخزنة غير كافٍ" }, { status: 400 });
        }

        await prisma.cashbox.update({
          where: { id: data.cashboxId },
          data: { balance: { decrement: data.amount } },
        });

        await prisma.treasuryTransaction.create({
          data: {
            type: "WITHDRAW",
            sourceType: "CASHBOX",
            sourceId: data.cashboxId,
            amount: data.amount,
            reason: `مصروف: ${data.title}`,
            responsible: user.name || user.email || null,
            referenceType: "EXPENSE",
            referenceId: expense.id,
          },
        });
      }
    }

    await logActivity({
      action: "CREATE",
      entity: "Expense",
      entityId: expense.id,
      description: `مصروف: ${expense.title} بقيمة ${expense.amount} ج.م`,
      metadata: {
        expenseId: expense.id,
        title: expense.title,
        amount: expense.amount,
        cashboxId: data.cashboxId || null,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(expenses);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}