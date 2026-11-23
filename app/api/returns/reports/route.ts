import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};
    if (type && type !== "ALL") where.type = type;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to + "T23:59:59");
    }

    const returns = await prisma.return.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(returns);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}