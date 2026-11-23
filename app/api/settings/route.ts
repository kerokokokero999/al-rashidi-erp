import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({ where: { id: "global" } });
    if (!settings) {
      settings = await prisma.settings.create({ data: { id: "global" } });
    }
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const settings = await prisma.settings.update({
      where: { id: "global" },
      data: {
        storeName: body.storeName,
        phone: body.phone,
        whatsapp: body.whatsapp,
        address: body.address,
        taxNumber: body.taxNumber,
        currency: body.currency,
        defaultTaxRate: Number(body.defaultTaxRate),
        defaultDiscount: Number(body.defaultDiscount),
        autoPrintInvoice: Boolean(body.autoPrintInvoice),
        enableBarcode: Boolean(body.enableBarcode),
        invoicePrefix: body.invoicePrefix,
        // 👇 الحقول الجديدة
        logo: body.logo || null,
        footerText: body.footerText || null,
        phone2: body.phone2 || null,
      },
    });
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}