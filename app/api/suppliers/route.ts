import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";
import { logActivity } from "../../../lib/audit";
import { supplierSchema, formatZodError } from "../../../lib/validations";

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(suppliers);
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
    const result = supplierSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: formatZodError(result.error) },
        { status: 400 }
      );
    }

    const data = result.data;

    const existing = await prisma.supplier.findUnique({ where: { phone: data.phone } });
    if (existing) return NextResponse.json({ error: "رقم التليفون مسجل بالفعل" }, { status: 400 });

    const supplier = await prisma.supplier.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
      },
    });

    await logActivity({
      action: "CREATE",
      entity: "Supplier",
      entityId: supplier.id,
      description: `إضافة مورد: ${supplier.name} (${supplier.phone})`,
      metadata: {
        supplierId: supplier.id,
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email,
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}