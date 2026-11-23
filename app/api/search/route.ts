import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const [products, customers, suppliers, invoices] = await Promise.all([
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { barcode: { contains: q } },
          ],
        },
        take: 5,
        select: { id: true, name: true, sellPrice: true, stock: true },
      }),
      prisma.customer.findMany({
        where: {
          OR: [{ name: { contains: q } }, { phone: { contains: q } }],
        },
        take: 5,
        select: { id: true, name: true, phone: true },
      }),
      prisma.supplier.findMany({
        where: {
          OR: [{ name: { contains: q } }, { phone: { contains: q } }],
        },
        take: 5,
        select: { id: true, name: true, phone: true },
      }),
      prisma.invoice.findMany({
        where: {
          OR: [
            { id: isNaN(Number(q)) ? undefined : Number(q) },
            { customer: { name: { contains: q } } },
          ],
        },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, total: true, createdAt: true },
      }),
    ]);

    const results = [
      ...products.map((p) => ({
        type: "product" as const,
        id: p.id,
        title: p.name,
        subtitle: `${p.sellPrice.toLocaleString("ar-EG")} ج.م · متوفر: ${p.stock}`,
        href: `/products/edit/${p.id}`,
      })),
      ...customers.map((c) => ({
        type: "customer" as const,
        id: c.id,
        title: c.name,
        subtitle: c.phone,
        href: `/customers/edit/${c.id}`,
      })),
      ...suppliers.map((s) => ({
        type: "supplier" as const,
        id: s.id,
        title: s.name,
        subtitle: s.phone,
        href: `/suppliers/edit/${s.id}`,
      })),
      ...invoices.map((i) => ({
        type: "invoice" as const,
        id: i.id,
        title: `فاتورة #${i.id}`,
        subtitle: `${i.total.toLocaleString("ar-EG")} ج.م · ${new Date(i.createdAt).toLocaleDateString("ar-EG")}`,
        href: `/invoices`,
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ results: [] });
  }
}