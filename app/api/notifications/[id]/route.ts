import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";

// تحديد إشعار واحد كمقروء
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
    await prisma.notification.update({
      where: { id: Number(resolvedParams.id) },
      data: { isRead: true },
    });

    return NextResponse.json({ message: "تم تحديد الإشعار كمقروء" });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

// ✅ حذف إشعار واحد
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const resolvedParams = await params;
    await prisma.notification.delete({
      where: { id: Number(resolvedParams.id) },
    });

    return NextResponse.json({ message: "تم حذف الإشعار" });
  } catch (error) {
    console.error("Delete notification error:", error);
    return NextResponse.json({ error: "حدث خطأ في الحذف" }, { status: 500 });
  }
}