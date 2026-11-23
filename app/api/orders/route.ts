import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";
import { createNotification } from "../../../lib/notifications";

// إضافة طلب جديد (من الزائر)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, customerPhone, customerAddress, items, total, notes } = body;

    const order = await prisma.order.create({
      data: {
        customerName,
        customerPhone,
        customerAddress,
        items: JSON.stringify(items), // ← SQLite: items بقت String
        total,
        notes: notes || null,
      },
    });

    // إضافة إشعار للمدير
    await createNotification({
      title: "طلب جديد من الموقع",
      message: `طلب جديد من ${customerName} بقيمة ${total} ج.م`,
      type: "ORDER",
      link: "/orders",
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

// جلب كل الطلبات (للمدير فقط)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user || (user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const result = await prisma.order.deleteMany({});

    return NextResponse.json({
      message: `تم حذف ${result.count} طلب`,
      count: result.count,
    });
  } catch (error) {
    console.error("Delete all orders error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}