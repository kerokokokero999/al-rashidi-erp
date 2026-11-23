"use client";

import { useState, useEffect } from "react";
import Header from "../../../components/Header";
import Link from "next/link";
import {
  ArrowRight,
  Wallet,
  Truck,
  Search,
  Calendar,
  Download,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { showError, showSuccess } from "@/utils/alerts";

type Supplier = { id: number; name: string };

type Payment = {
  id: number;
  amount: number;
  paymentMethod: string;
  notes: string | null;
  createdAt: string;
  supplier: { name: string } | null;
  purchase: { id: number; total: number } | null;
};

export default function SupplierPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("type", "SUPPLIER");
      if (selectedSupplier !== "all") params.set("supplierId", selectedSupplier);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const [payRes, supRes] = await Promise.all([
        fetch(`/api/payments/report?${params.toString()}`),
        fetch("/api/suppliers"),
      ]);
      if (payRes.ok) setPayments(await payRes.json());
      if (supRes.ok) setSuppliers(await supRes.json());
    } catch {
      showError("حدث خطأ في جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSupplier]);

  const filtered = payments.filter((p) => {
    const term = search.toLowerCase();
    if (!term) return true;
    return (
      p.supplier?.name.toLowerCase().includes(term) ||
      p.notes?.toLowerCase().includes(term) ||
      p.id.toString().includes(term)
    );
  });

  const totalPaid = filtered.reduce((sum, p) => sum + p.amount, 0);

  const exportCSV = () => {
    if (filtered.length === 0) {
      showError("لا توجد بيانات");
      return;
    }
    const headers = ["رقم الدفعة", "المورد", "المبلغ", "طريقة الدفع", "فاتورة المشتريات", "ملاحظات", "التاريخ"];
    const rows = filtered.map((p) =>
      [
        p.id,
        p.supplier?.name || "—",
        p.amount,
        p.paymentMethod,
        p.purchase?.id || "—",
        p.notes || "—",
        new Date(p.createdAt).toLocaleDateString("ar-EG"),
      ].join(",")
    );
    const blob = new Blob(["\uFEFF" + `${headers.join(",")}\n${rows.join("\n")}`], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `supplier-payments-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    showSuccess("تم تصدير الملف");
  };

  const paymentMethodLabel = (m: string) =>
    m === "CASH" ? "كاش" : m === "CARD" ? "فيزا / بطاقة" : m === "BANK" ? "تحويل بنكي" : m;

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 animate-slide-down">
          <div className="flex items-center gap-3">
            <Link
              href="/suppliers"
              className="text-[var(--color-neutral-500)] hover:text-primary-600 hover:bg-primary-50 transition-colors p-2 rounded-lg"
            >
              <ArrowRight size={22} />
            </Link>
            <div className="p-3 rounded-xl bg-primary-100">
              <Wallet className="text-primary-600" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">
                تقرير المدفوعات للموردين
              </h1>
              <p className="text-sm text-[var(--color-neutral-500)] mt-1">
                {filtered.length} دفعة — إجمالي {totalPaid.toLocaleString("ar-EG")} ج.م
              </p>
            </div>
          </div>
          <button
            onClick={exportCSV}
            className="bg-success-400 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-success-500 active:scale-[0.97] transition-all shadow-sm shadow-success-200 text-sm"
          >
            <Download size={16} /> تصدير CSV
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 stagger-children">
          <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-100">
              <Truck className="text-primary-600" size={20} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-neutral-500)]">عدد الدفعات</div>
              <div className="text-xl font-extrabold text-[var(--color-fg)]">{filtered.length}</div>
            </div>
          </div>
          <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success-100">
              <TrendingUp className="text-success-600" size={20} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-neutral-500)]">إجمالي المدفوع</div>
              <div className="text-xl font-extrabold text-success-600">
                {totalPaid.toLocaleString("ar-EG")} ج.م
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl shadow-sm border border-[var(--color-card-border)] mb-6 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5 flex items-center gap-1.5">
                <Truck size={14} className="text-[var(--color-neutral-400)]" /> المورد
              </label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
              >
                <option value="all">كل الموردين</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} className="text-[var(--color-neutral-400)]" /> من تاريخ
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} className="text-[var(--color-neutral-400)]" /> إلى تاريخ
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchData}
                className="w-full bg-primary-500 text-white p-3 rounded-xl font-bold hover:bg-primary-600 active:scale-[0.97] transition-all text-sm"
              >
                بحث
              </button>
            </div>
          </div>
          <div className="relative mt-3">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]" size={16} />
            <input
              type="text"
              placeholder="ابحث باسم المورد أو رقم الدفعة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-2 border-[var(--color-neutral-200)] p-3 pr-10 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] overflow-x-auto animate-slide-up">
          <table className="w-full text-right">
            <thead className="bg-[var(--color-bg)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
              <tr>
                <th className="p-4 font-bold">رقم الدفعة</th>
                <th className="p-4 font-bold">المورد</th>
                <th className="p-4 font-bold">فاتورة المشتريات</th>
                <th className="p-4 font-bold">المبلغ</th>
                <th className="p-4 font-bold">طريقة الدفع</th>
                <th className="p-4 font-bold">ملاحظات</th>
                <th className="p-4 font-bold">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[var(--color-neutral-500)]">
                    جاري التحميل...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <Wallet className="mx-auto text-neutral-300 mb-3" size={48} />
                    <p className="text-[var(--color-neutral-500)]">لا توجد مدفوعات.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-primary-600">#{p.id}</td>
                    <td className="p-4 font-bold text-[var(--color-fg)]">
                      {p.supplier?.name || "—"}
                    </td>
                    <td className="p-4 text-sm text-[var(--color-neutral-600)]">
                      {p.purchase ? `#${p.purchase.id}` : "—"}
                    </td>
                    <td className="p-4 font-bold text-success-600">
                      {p.amount.toLocaleString("ar-EG")} ج.م
                    </td>
                    <td className="p-4 text-sm text-[var(--color-neutral-600)]">
                      {paymentMethodLabel(p.paymentMethod)}
                    </td>
                    <td className="p-4 text-sm text-[var(--color-neutral-500)]">{p.notes || "—"}</td>
                    <td className="p-4 text-sm text-[var(--color-neutral-500)]">
                      {new Date(p.createdAt).toLocaleDateString("ar-EG")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="bg-[var(--color-bg)] border-t-2 border-[var(--color-neutral-200)]">
                <tr>
                  <td colSpan={3} className="p-4 font-extrabold text-[var(--color-fg)] text-left">
                    الإجمالي:
                  </td>
                  <td className="p-4 font-extrabold text-success-600">
                    {totalPaid.toLocaleString("ar-EG")} ج.م
                  </td>
                  <td colSpan={3} className="p-4"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </main>
    </>
  );
}