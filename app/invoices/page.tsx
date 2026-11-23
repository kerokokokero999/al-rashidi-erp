
import { prisma } from "../../lib/prisma";
import Header from "../../components/Header";
import {
  ReceiptText,
  Calendar,
  Package,
  DollarSign,
  Plus,
} from "lucide-react";
import InvoiceDetailsModal from "../../components/InvoiceDetailsModal";
import InvoicePDF from "../../components/InvoicePDF";
import InvoicesPagination from "../../components/InvoicesPagination";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface InvoicesPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
  }>;
}

export default async function InvoicesPage({
  searchParams,
}: InvoicesPageProps) {
  const params = await searchParams;

  const requestedPage = Number.parseInt(
    params.page || "1",
    10
  );

  const requestedPageSize = Number.parseInt(
    params.pageSize || "20",
    10
  );

  const allowedPageSizes = [10, 20, 25, 50, 100];

  const pageSize = allowedPageSizes.includes(requestedPageSize)
    ? requestedPageSize
    : 20;

  const [totalItems, settings, totals] = await Promise.all([
    prisma.invoice.count(),

    prisma.settings.findUnique({
      where: { id: "global" },
    }),

    prisma.invoice.aggregate({
      _sum: {
        total: true,
      },
    }),
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / pageSize)
  );

  const currentPage = Math.min(
    Math.max(
      1,
      Number.isFinite(requestedPage) ? requestedPage : 1
    ),
    totalPages
  );

  const invoices = await prisma.invoice.findMany({
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],

    skip: (currentPage - 1) * pageSize,
    take: pageSize,

    include: {
      items: true,
      customer: true,
    },
  });

  const totalSales = totals._sum.total || 0;

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-100">
              <ReceiptText
                className="text-primary-600"
                size={28}
              />
            </div>

            <div>
              <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">
                سجل الفواتير
              </h1>

              <p className="text-sm text-[var(--color-neutral-500)] mt-1">
                {totalItems.toLocaleString("ar-EG")} فاتورة
                {" — "}
                إجمالي{" "}
                {totalSales.toLocaleString("ar-EG")} ج.م
              </p>
            </div>
          </div>

          <Link
            href="/invoices/create"
            className="bg-primary-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-600 active:scale-[0.97] transition-all shadow-sm shadow-primary-200"
          >
            <Plus size={18} />
            فاتورة جديدة
          </Link>
        </div>

        {/* Table */}
        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] overflow-x-auto animate-slide-up">

          <table className="w-full text-right whitespace-nowrap">
            <thead className="bg-[var(--color-bg)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
              <tr>
                <th className="p-4 font-bold">
                  رقم الفاتورة
                </th>

                <th className="p-4 font-bold">
                  التاريخ
                </th>

                <th className="p-4 font-bold">
                  العميل
                </th>

                <th className="p-4 font-bold">
                  عدد الأصناف
                </th>

                <th className="p-4 font-bold">
                  الإجمالي
                </th>

                <th className="p-4 font-bold text-center">
                  إجراءات
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <ReceiptText
                      className="mx-auto text-neutral-300 mb-3"
                      size={48}
                    />

                    <p className="text-[var(--color-neutral-500)]">
                      لا توجد فواتير حتى الآن.
                    </p>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => {
                  const items = invoice.items || [];

                  const formattedDate = new Date(
                    invoice.createdAt
                  ).toLocaleString("ar-EG");

                  return (
                    <tr
                      key={invoice.id}
                      className="hover:bg-primary-50/30 transition-colors"
                    >
                      <td className="p-4 font-mono text-sm text-primary-600 font-bold">
                        #{invoice.id}
                      </td>

                      <td className="p-4 text-sm text-[var(--color-neutral-600)]">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar
                            size={14}
                            className="text-[var(--color-neutral-400)]"
                          />
                          {formattedDate}
                        </span>
                      </td>

                      <td className="p-4 text-sm text-[var(--color-neutral-700)]">
                        {invoice.customer?.name || "عميل نقدي"}
                      </td>

                      <td className="p-4 text-sm text-[var(--color-neutral-600)]">
                        <span className="inline-flex items-center gap-1.5">
                          <Package
                            size={14}
                            className="text-[var(--color-neutral-400)]"
                          />
                          {items.length} صنف
                        </span>
                      </td>

                      <td className="p-4 font-bold text-success-600">
                        <span className="inline-flex items-center gap-1.5">
                          <DollarSign size={14} />
                          {invoice.total.toLocaleString("ar-EG")} ج.م
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <InvoiceDetailsModal
                            invoice={{
                              id: invoice.id.toString(),

                              items: items.map((item) => ({
                                id:
                                  item.productId?.toString() || "",
                                name: item.name,
                                quantity: item.quantity,
                                sellPrice: item.sellPrice,
                              })),

                              total: invoice.total,
                              subTotal: invoice.subTotal,
                              discount: invoice.discount,
                              tax: invoice.tax,
                              paymentMethod: invoice.paymentMethod,
                              customerName:
                                invoice.customer?.name || "عميل نقدي",
                              createdAt: formattedDate,
                            }}
                          />

                          <InvoicePDF
                            invoice={{
                              id: invoice.id.toString(),

                              items: items.map((item) => ({
                                id:
                                  item.productId?.toString() || "",
                                name: item.name,
                                quantity: item.quantity,
                                sellPrice: item.sellPrice,
                                unitName:
                                  item.unitName || undefined,
                              })),

                              subTotal: invoice.subTotal,
                              discount: invoice.discount,
                              tax: invoice.tax,
                              total: invoice.total,
                              paymentMethod: invoice.paymentMethod,
                              customerName:
                                invoice.customer?.name || "عميل نقدي",
                              createdAt: formattedDate,
                            }}
                            settings={settings}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <InvoicesPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
          />
        </div>
      </main>
    </>
  );
}