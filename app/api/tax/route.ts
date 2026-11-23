import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const dateFilter: Record<string, unknown> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to + "T23:59:59");

    const where: Record<string, unknown> = {};
    if (from || to) where.createdAt = dateFilter;

    // 1. فواتير المبيعات
    const invoices = await prisma.invoice.findMany({
      where,
      include: { customer: true, items: true },
      orderBy: { createdAt: "desc" },
    });

    // 2. فواتير المشتريات
    const purchases = await prisma.purchase.findMany({
      where,
      include: { supplier: true, purchaseItems: true },
      orderBy: { createdAt: "desc" },
    });

    // 3. مرتجعات المبيعات
    const saleReturns = await prisma.return.findMany({
      where: { ...where, type: "SALE" },
      orderBy: { createdAt: "desc" },
    });

    // 4. مرتجعات المشتريات
    const purchaseReturns = await prisma.return.findMany({
      where: { ...where, type: "PURCHASE" },
      orderBy: { createdAt: "desc" },
    });

    // بناء قائمة العمليات
    const transactions: Array<{
      id: number;
      refNumber: string;
      type: string;
      typeLabel: string;
      date: string;
      partyName: string;
      total: number;
      tax: number;
      totalAfterTax: number;
    }> = [];

    // مبيعات
    invoices.forEach((inv) => {
      transactions.push({
        id: inv.id,
        refNumber: `INV-${inv.id}`,
        type: "SALE",
        typeLabel: "فاتورة مبيعات",
        date: inv.createdAt.toISOString(),
        partyName: inv.customer?.name || "عميل نقدي",
        total: inv.subTotal - inv.discount,
        tax: inv.tax,
        totalAfterTax: inv.total,
      });
    });

    // مشتريات
    purchases.forEach((p) => {
      transactions.push({
        id: p.id,
        refNumber: `PUR-${p.id}`,
        type: "PURCHASE",
        typeLabel: "فاتورة مشتريات",
        date: p.createdAt.toISOString(),
        partyName: p.supplier?.name || "—",
        total: p.total,
        tax: 0,
        totalAfterTax: p.total,
      });
    });

    // مرتجعات مبيعات
    saleReturns.forEach((r) => {
      transactions.push({
        id: r.id,
        refNumber: `RET-${r.id}`,
        type: "SALE_RETURN",
        typeLabel: "مرتجع مبيعات",
        date: r.createdAt.toISOString(),
        partyName: "—",
        total: r.total,
        tax: 0,
        totalAfterTax: r.total,
      });
    });

    // مرتجعات مشتريات
    purchaseReturns.forEach((r) => {
      transactions.push({
        id: r.id,
        refNumber: `PRET-${r.id}`,
        type: "PURCHASE_RETURN",
        typeLabel: "مرتجع مشتريات",
        date: r.createdAt.toISOString(),
        partyName: "—",
        total: r.total,
        tax: 0,
        totalAfterTax: r.total,
      });
    });

    // ترتيب حسب التاريخ
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // الإجماليات
    const totalSales = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalSalesTax = invoices.reduce((sum, inv) => sum + inv.tax, 0);
    const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
    const totalSaleReturns = saleReturns.reduce((sum, r) => sum + r.total, 0);
    const totalPurchaseReturns = purchaseReturns.reduce((sum, r) => sum + r.total, 0);

    const netTax = totalSalesTax; // ضريبة المبيعات (المشتريات مش فيها ضريبة مسجلة حاليًا)

    return NextResponse.json({
      transactions,
      summary: {
        totalSales,
        totalSalesTax,
        totalPurchases,
        totalSaleReturns,
        totalPurchaseReturns,
        netTax,
        totalTransactions: transactions.length,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}