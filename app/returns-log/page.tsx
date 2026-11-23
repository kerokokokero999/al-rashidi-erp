import { prisma } from "../../lib/prisma";
import Header from "../../components/Header";
import {
  RotateCcw,
  Calendar,
  Package,
  DollarSign,
  SearchX,
  ReceiptText,
  ShoppingBag,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReturnsLogPage() {
  const returns = await prisma.return.findMany({
    orderBy: { createdAt: "desc" },
  });

  const totalSaleReturns = returns
    .filter((r) => r.type === "SALE")
    .reduce((sum, r) => sum + r.total, 0);
  const totalPurchaseReturns = returns
    .filter((r) => r.type === "PURCHASE")
    .reduce((sum, r) => sum + r.total, 0);

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-orange-100">
              <RotateCcw className="text-orange-600" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">سجل المرتجعات</h1>
              <p className="text-sm text-[var(--color-neutral-500)] mt-1">
                {returns.length} عملية إرجاع
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 stagger-children">
          <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-100">
              <ReceiptText className="text-primary-600" size={20} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-neutral-500)]">مرتجعات مبيعات</div>
              <div className="text-xl font-extrabold text-primary-600">
                {totalSaleReturns.toLocaleString("ar-EG")} ج.م
              </div>
            </div>
          </div>
          <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-100">
              <ShoppingBag className="text-orange-600" size={20} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-neutral-500)]">مرتجعات مشتريات</div>
              <div className="text-xl font-extrabold text-orange-600">
                {totalPurchaseReturns.toLocaleString("ar-EG")} ج.م
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] overflow-x-auto animate-slide-up">
          <table className="w-full text-right">
            <thead className="bg-[var(--color-bg)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
              <tr>
                <th className="p-4 font-bold">النوع</th>
                <th className="p-4 font-bold">رقم الفاتورة</th>
                <th className="p-4 font-bold">التاريخ</th>
                <th className="p-4 font-bold">عدد الأصناف</th>
                <th className="p-4 font-bold">المبلغ المرتجع</th>
                <th className="p-4 font-bold">السبب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {returns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <SearchX className="mx-auto text-neutral-300 mb-3" size={48} />
                    <p className="text-[var(--color-neutral-500)]">لا توجد مرتجعات حتى الآن.</p>
                  </td>
                </tr>
              ) : (
                returns.map((ret) => {
                  const items = JSON.parse(ret.items as string) as Array<{
                    name: string;
                    quantity: number;
                  }>;
                  const isSale = ret.type === "SALE";
                  return (
                    <tr
                      key={ret.id}
                      className="hover:bg-orange-50/30 transition-colors"
                    >
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 ${
                            isSale
                              ? "bg-primary-100 text-primary-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {isSale ? <ReceiptText size={12} /> : <ShoppingBag size={12} />}
                          {isSale ? "مبيعات" : "مشتريات"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm text-primary-600 font-bold">
                          #{ret.invoiceId || ret.purchaseId}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-[var(--color-neutral-600)]">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar size={14} className="text-[var(--color-neutral-400)]" />
                          {new Date(ret.createdAt).toLocaleString("ar-EG")}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-[var(--color-neutral-600)]">
                        <span className="inline-flex items-center gap-1.5">
                          <Package size={14} className="text-[var(--color-neutral-400)]" />
                          {items.length} صنف
                        </span>
                      </td>
                      <td className="p-4 font-bold text-orange-600">
                        <span className="inline-flex items-center gap-1.5">
                          <DollarSign size={14} />
                          {ret.total.toLocaleString("ar-EG")} ج.م
                        </span>
                      </td>
                      <td className="p-4 text-sm text-[var(--color-neutral-500)]">
                        {ret.reason || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}