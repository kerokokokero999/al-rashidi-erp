import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const users = await prisma.user.findMany({ 
    orderBy: { name: "asc" },
    include: { branch: true }, // ← نجيب الفرع مع المستخدم
  });
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const body = await request.json();
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) return NextResponse.json({ error: "البريد الإلكتروني مسجل بالفعل" }, { status: 400 });

  const hashedPassword = await bcrypt.hash(body.password, 10);

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: hashedPassword,
      role: body.role,
      permissions: JSON.stringify(body.permissions || []),
      branchId: body.branchId ? Number(body.branchId) : null, // ← ضيف دي
    },
  });

  return NextResponse.json(user, { status: 201 });
}