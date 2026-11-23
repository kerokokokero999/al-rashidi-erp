import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    // جلب الفواتير آخر 7 أيام
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const invoices = await prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        total: true,
        createdAt: true,
      },
    });

    // تجميع المبيعات حسب اليوم
    const salesByDay: Record<string, number> = {};
    
    // تجهيز الأيام السبعة (حتى لو مفيش مبيعات)
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('ar-EG', { weekday: 'short' });
      salesByDay[dateStr] = 0;
    }

    invoices.forEach((inv) => {
      const dateStr = new Date(inv.createdAt).toLocaleDateString('ar-EG', { weekday: 'short' });
      if (salesByDay[dateStr] !== undefined) {
        salesByDay[dateStr] += inv.total;
      }
    });

    const chartData = Object.keys(salesByDay).map((day) => ({
      day,
      sales: salesByDay[day],
    }));

    return NextResponse.json(chartData);
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}