import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";

// تحديث فرع
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
    const body = await request.json();

    const branch = await prisma.branch.update({
      where: { id: Number(resolvedParams.id) },
      data: {
        name: body.name,
        address: body.address || null,
        phone: body.phone || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });

    return NextResponse.json(branch);
  } catch (error) {
    console.error("Update branch error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

// حذف فرع
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
    await prisma.branch.delete({
      where: { id: Number(resolvedParams.id) },
    });

    return NextResponse.json({ message: "تم حذف الفرع" });
  } catch (error) {
    console.error("Delete branch error:", error);
    return NextResponse.json({ error: "حدث خطأ (ربما الفرع مرتبط ببيانات)" }, { status: 500 });
  }
}