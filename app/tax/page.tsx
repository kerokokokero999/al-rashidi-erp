"use client";

import { useState, useEffect } from "react";
import Header from "../../components/Header";
import {
  FileText,
  Calendar,
  Search,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  ReceiptText,
  ShoppingBag,
  RotateCcw,
  DollarSign,
} from "lucide-react";
import { showError, showSuccess } from "@/utils/alerts";

type Transaction = {
  id: number;
  refNumber: string;
  type: string;
  typeLabel: string;
  date: string;
  partyName: string;
  total: number;
  tax: number;
  totalAfterTax: number;
};

type Summary = {
  totalSales: number;
  totalSalesTax: number;
  totalPurchases: number;
  totalSaleReturns: number;
  totalPurchaseReturns: number;
  netTax: number;
  totalTransactions: number;
};

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  SALE: { icon: ReceiptText, color: "text-primary-600", bg: "bg-primary-100" },
  PURCHASE: { icon: ShoppingBag, color: "text-info-500", bg: "bg-info-500/10" },
  SALE_RETURN: { icon: RotateCcw, color: "text-orange-600", bg: "bg-orange-100" },
  PURCHASE_RETURN: { icon: RotateCcw, color: "text-danger-500", bg: "bg-danger-50" },
};

export default function TaxPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [filterTypes, setFilterTypes] = useState<Record<string, boolean>>({
    SALE: true,
    PURCHASE: true,
    SALE_RETURN: true,
    PURCHASE_RETURN: true,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(`/api/tax?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
        setSummary(data.summary);
      }
    } catch {
      showError("حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = transactions.filter((t) => {
    if (!filterTypes[t.type]) return false;
    const term = search.toLowerCase();
    if (!term) return true;
    return (
      t.refNumber.toLowerCase().includes(term) ||
      t.partyName.toLowerCase().includes(term) ||
      t.typeLabel.includes(term)
    );
  });

  const filteredSummary = filtered.reduce(
    (acc, t) => ({
      total: acc.total + t.total,
      tax: acc.tax + t.tax,
      totalAfterTax: acc.totalAfterTax + t.totalAfterTax,
    }),
    { total: 0, tax: 0, totalAfterTax: 0 }
  );

  const exportCSV = () => {
    if (filtered.length === 0) {
      showError("لا توجد بيانات");
      return;
    }
    const headers = ["رقم العملية", "النوع", "التاريخ", "الجهة", "قبل الضريبة", "الضريبة", "بعد الضريبة"];
    const rows = filtered.map((t) =>
      [t.refNumber, t.typeLabel, new Date(t.date).toLocaleDateString("ar-EG"), t.partyName, t.total, t.tax, t.totalAfterTax].join(",")
    );
    const blob = new Blob(["\uFEFF" + `${headers.join(",")}\n${rows.join("\n")}`], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `tax-report-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    showSuccess("تم تصدير الملف");
  };

  if (loading)
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-pulse-soft">
          <FileText className="text-primary-500 mx-auto mb-4" size={48} />
          <p className="text-[var(--color-neutral-500)] font-bold">جاري التحميل...</p>
        </div>
      </div>
    );

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-100">
              <FileText className="text-primary-600" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">الإقرار الضريبي</h1>
              <p className="text-sm text-[var(--color-neutral-500)] mt-1">
                {filtered.length} عملية
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="bg-success-400 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-success-500 active:scale-[0.97] transition-all shadow-sm shadow-success-200 text-sm"
            >
              <Download size={16} /> تصدير
            </button>
            <button
              onClick={() => window.print()}
              className="bg-info-500 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 active:scale-[0.97] transition-all shadow-sm text-sm no-print"
            >
              <Printer size={16} /> طباعة
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 stagger-children">
            <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)] flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary-100">
                <TrendingUp className="text-primary-600" size={20} />
              </div>
              <div>
                <div className="text-xs text-[var(--color-neutral-500)]">إجمالي المبيعات</div>
                <div className="text-lg font-extrabold text-primary-600">
                  {summary.totalSales.toLocaleString("ar-EG")} ج.م
                </div>
              </div>
            </div>
            <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)] flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-info-500/10">
                <ShoppingBag className="text-info-500" size={20} />
              </div>
              <div>
                <div className="text-xs text-[var(--color-neutral-500)]">إجمالي المشتريات</div>
                <div className="text-lg font-extrabold text-info-500">
                  {summary.totalPurchases.toLocaleString("ar-EG")} ج.م
                </div>
              </div>
            </div>
            <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)] flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-100">
                <RotateCcw className="text-orange-600" size={20} />
              </div>
              <div>
                <div className="text-xs text-[var(--color-neutral-500)]">إجمالي المرتجعات</div>
                <div className="text-lg font-extrabold text-orange-600">
                  {(summary.totalSaleReturns + summary.totalPurchaseReturns).toLocaleString("ar-EG")} ج.م
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-danger-500 to-danger-700 p-4 rounded-2xl text-white shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[var(--color-card-bg)]/20">
                  <DollarSign size={20} />
                </div>
                <div>
                  <div className="text-xs text-danger-100">صافي الضريبة</div>
                  <div className="text-lg font-extrabold">
                    {summary.netTax.toLocaleString("ar-EG")} ج.م
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl shadow-sm border border-[var(--color-card-border)] mb-6 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
            />
            <div className="relative md:col-span-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]" size={16} />
              <input
                type="text"
                placeholder="ابحث..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border-2 border-[var(--color-neutral-200)] p-3 pr-10 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
              />
            </div>
            <button
              onClick={fetchData}
              className="bg-primary-500 text-white p-3 rounded-xl font-bold hover:bg-primary-600 active:scale-[0.97] transition-all text-sm"
            >
              بحث
            </button>
          </div>

          {/* Type Filters */}
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              { key: "SALE", label: "مبيعات" },
              { key: "PURCHASE", label: "مشتريات" },
              { key: "SALE_RETURN", label: "مرتجع مبيعات" },
              { key: "PURCHASE_RETURN", label: "مرتجع مشتريات" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setFilterTypes({ ...filterTypes, [t.key]: !filterTypes[t.key] })}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  filterTypes[t.key]
                    ? "bg-primary-500 text-white"
                    : "bg-[var(--color-neutral-100)] text-[var(--color-neutral-500)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] overflow-x-auto animate-slide-up">
          <table className="w-full text-right">
            <thead className="bg-[var(--color-bg)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
              <tr>
                <th className="p-4 font-bold">#</th>
                <th className="p-4 font-bold">رقم العملية</th>
                <th className="p-4 font-bold">النوع</th>
                <th className="p-4 font-bold">التاريخ</th>
                <th className="p-4 font-bold">الجهة</th>
                <th className="p-4 font-bold">قبل الضريبة</th>
                <th className="p-4 font-bold">الضريبة</th>
                <th className="p-4 font-bold">بعد الضريبة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <FileText className="mx-auto text-neutral-300 mb-3" size={48} />
                    <p className="text-[var(--color-neutral-500)]">لا توجد عمليات في هذه الفترة.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((t, idx) => {
                  const config = typeConfig[t.type] || typeConfig.SALE;
                  const Icon = config.icon;
                  return (
                    <tr key={`${t.type}-${t.id}`} className="hover:bg-primary-50/30 transition-colors">
                      <td className="p-4 text-sm text-[var(--color-neutral-500)]">{idx + 1}</td>
                      <td className="p-4 font-mono font-bold text-primary-600">{t.refNumber}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 ${config.bg} ${config.color}`}>
                          <Icon size={12} /> {t.typeLabel}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-[var(--color-neutral-600)]">
                        {new Date(t.date).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="p-4 text-sm text-[var(--color-neutral-700)]">{t.partyName}</td>
                      <td className="p-4 text-sm font-bold text-[var(--color-neutral-700)]">
                        {t.total.toLocaleString("ar-EG")} ج.م
                      </td>
                      <td className="p-4 text-sm font-bold text-orange-600">
                        {t.tax.toLocaleString("ar-EG")} ج.م
                      </td>
                      <td className="p-4 font-bold text-primary-600">
                        {t.totalAfterTax.toLocaleString("ar-EG")} ج.م
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="bg-[var(--color-bg)] border-t-2 border-[var(--color-neutral-200)]">
                <tr>
                  <td colSpan={5} className="p-4 font-extrabold text-[var(--color-fg)] text-left">
                    الإجماليات:
                  </td>
                  <td className="p-4 font-extrabold text-[var(--color-fg)]">
                    {filteredSummary.total.toLocaleString("ar-EG")} ج.م
                  </td>
                  <td className="p-4 font-extrabold text-orange-600">
                    {filteredSummary.tax.toLocaleString("ar-EG")} ج.م
                  </td>
                  <td className="p-4 font-extrabold text-primary-600">
                    {filteredSummary.totalAfterTax.toLocaleString("ar-EG")} ج.م
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </main>
    </>
  );
}