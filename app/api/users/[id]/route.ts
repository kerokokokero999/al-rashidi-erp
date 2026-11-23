import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const user = await prisma.user.findUnique({
    where: { id: resolvedParams.id },
    include: { branch: true }, // ← نجيب الفرع
  });
  return NextResponse.json(user);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const resolvedParams = await params;
  const body = await request.json();
  
  const updated = await prisma.user.update({
    where: { id: resolvedParams.id },
    data: {
      name: body.name,
      role: body.role,
      permissions: JSON.stringify(body.permissions || []),
      branchId: body.branchId ? Number(body.branchId) : null, // ← ضيف دي
    },
  });
  
  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const resolvedParams = await params;
  await prisma.user.delete({
    where: { id: resolvedParams.id },
  });
  return NextResponse.json({ message: "تم الحذف" });
}