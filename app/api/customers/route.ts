import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";
import { logActivity } from "../../../lib/audit";
import { customerSchema, formatZodError } from "../../../lib/validations";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(customers);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await request.json();

    // ✅ Validation
    const result = customerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: formatZodError(result.error) },
        { status: 400 }
      );
    }

    const data = result.data;

    const existing = await prisma.customer.findUnique({ where: { phone: data.phone } });
    if (existing) return NextResponse.json({ error: "رقم التليفون مسجل بالفعل" }, { status: 400 });

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
      },
    });

    await logActivity({
      action: "CREATE",
      entity: "Customer",
      entityId: customer.id,
      description: `إضافة عميل: ${customer.name} (${customer.phone})`,
      metadata: {
        customerId: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}