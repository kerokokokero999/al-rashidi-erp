"use client";

import { useState, useEffect } from "react";
import Header from "../../../components/Header";
import Link from "next/link";
import {
  ArrowRight,
  Wallet,
  Calendar,
  Truck,
  Search,
  CreditCard,
  X,
  Check,
} from "lucide-react";
import { showSuccess, showError } from "@/utils/alerts";

type PendingPurchase = {
  id: number;
  supplierId: number;
  supplierName: string;
  total: number;
  paidAmount: number;
  remaining: number;
  createdAt: string;
  dueDate: string | null;
};

type Supplier = { id: number; name: string };
type Cashbox = { id: number; name: string; balance: number };

export default function SupplierAccountsPage() {
  const [purchases, setPurchases] = useState<PendingPurchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [cashboxes, setCashboxes] = useState<Cashbox[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [payingPurchase, setPayingPurchase] = useState<PendingPurchase | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [selectedCashbox, setSelectedCashbox] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSupplier !== "all") params.set("supplierId", selectedSupplier);

      const [accRes, supRes, cbRes] = await Promise.all([
        fetch(`/api/suppliers/accounts?${params.toString()}`),
        fetch("/api/suppliers"),
        fetch("/api/cashboxes"),
      ]);
      if (accRes.ok) setPurchases(await accRes.json());
      if (supRes.ok) setSuppliers(await supRes.json());
      if (cbRes.ok) {
        const cb = await cbRes.json();
        setCashboxes(cb);
        if (cb.length > 0) setSelectedCashbox(cb[0].id.toString());
      }
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

  const filtered = purchases.filter((p) => {
    const term = search.toLowerCase();
    if (!term) return true;
    return p.supplierName.toLowerCase().includes(term) || p.id.toString().includes(term);
  });

  const totalRemaining = filtered.reduce((sum, p) => sum + p.remaining, 0);

  const openPayment = (p: PendingPurchase) => {
    setPayingPurchase(p);
    setPayAmount(p.remaining);
    setPaymentMethod("CASH");
    setNotes("");
  };

  const handleSubmitPayment = async () => {
    if (!payingPurchase) return;
    if (payAmount <= 0 || payAmount > payingPurchase.remaining) {
      showError(`المبلغ يجب أن يكون بين 0 و ${payingPurchase.remaining}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SUPPLIER",
          supplierId: payingPurchase.supplierId,
          purchaseId: payingPurchase.id,
          amount: payAmount,
          paymentMethod,
          notes,
          cashboxId: paymentMethod === "CASH" && selectedCashbox ? Number(selectedCashbox) : null,
        }),
      });

      if (res.ok) {
        showSuccess(`تم تسجيل دفعة ${payAmount} ج.م`);
        setPayingPurchase(null);
        fetchData();
      } else {
        const data = await res.json();
        showError(data.error || "حدث خطأ");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 animate-slide-down">
          <div className="flex items-center gap-3">
            <Link href="/suppliers" className="text-[var(--color-neutral-500)] hover:text-primary-600 hover:bg-primary-50 transition-colors p-2 rounded-lg">
              <ArrowRight size={22} />
            </Link>
            <div className="p-3 rounded-xl bg-primary-100">
              <Wallet className="text-primary-600" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">حسابات الموردين</h1>
              <p className="text-sm text-[var(--color-neutral-500)] mt-1">
                {filtered.length} فاتورة آجلة — إجمالي متبقي {totalRemaining.toLocaleString("ar-EG")} ج.م
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl shadow-sm border border-[var(--color-card-border)] mb-6 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5 flex items-center gap-1.5">
                <Truck size={14} className="text-[var(--color-neutral-400)]" /> المورد
              </label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
              >
                <option value="all">كل الموردين</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5 flex items-center gap-1.5">
                <Search size={14} className="text-[var(--color-neutral-400)]" /> بحث
              </label>
              <input
                type="text"
                placeholder="اسم المورد أو رقم الفاتورة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <div className="bg-danger-50 p-3 rounded-xl w-full text-center">
                <div className="text-xs text-danger-600 mb-0.5">إجمالي المتبقي</div>
                <div className="text-lg font-extrabold text-danger-600">
                  {totalRemaining.toLocaleString("ar-EG")} ج.م
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] overflow-x-auto animate-slide-up">
          <table className="w-full text-right">
            <thead className="bg-[var(--color-bg)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
              <tr>
                <th className="p-4 font-bold">رقم الفاتورة</th>
                <th className="p-4 font-bold">المورد</th>
                <th className="p-4 font-bold">التاريخ</th>
                <th className="p-4 font-bold">الاستحقاق</th>
                <th className="p-4 font-bold">الإجمالي</th>
                <th className="p-4 font-bold">المدفوع</th>
                <th className="p-4 font-bold">المتبقي</th>
                <th className="p-4 font-bold text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr><td colSpan={8} className="p-12 text-center text-[var(--color-neutral-500)]">جاري التحميل...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <Wallet className="mx-auto text-neutral-300 mb-3" size={48} />
                    <p className="text-[var(--color-neutral-500)]">لا توجد فواتير آجلة معلقة.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const percentPaid = (p.paidAmount / p.total) * 100;
                  return (
                    <tr key={p.id} className="hover:bg-primary-50/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-primary-600">#{p.id}</td>
                      <td className="p-4 font-bold text-[var(--color-fg)]">{p.supplierName}</td>
                      <td className="p-4 text-sm text-[var(--color-neutral-600)]">
                        {new Date(p.createdAt).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="p-4 text-sm">
                        {p.dueDate ? (
                          <span className="text-orange-600 font-bold">
                            {new Date(p.dueDate).toLocaleDateString("ar-EG")}
                          </span>
                        ) : (
                          <span className="text-[var(--color-neutral-400)]">—</span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-[var(--color-fg)]">
                        {p.total.toLocaleString("ar-EG")} ج.م
                      </td>
                      <td className="p-4 font-bold text-success-600">
                        {p.paidAmount.toLocaleString("ar-EG")} ج.م
                        <div className="text-xs text-[var(--color-neutral-400)] font-normal">
                          {percentPaid.toFixed(0)}%
                        </div>
                      </td>
                      <td className="p-4 font-bold text-danger-600">
                        {p.remaining.toLocaleString("ar-EG")} ج.م
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => openPayment(p)}
                          className="bg-primary-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-primary-600 active:scale-[0.97] transition-all inline-flex items-center gap-1"
                        >
                          <CreditCard size={14} /> سداد
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {payingPurchase && (
          <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
              <div className="p-5 border-b border-[var(--color-card-border)] flex justify-between items-center">
                <h2 className="text-lg font-extrabold text-[var(--color-fg)]">تسديد دفعة</h2>
                <button
                  onClick={() => setPayingPurchase(null)}
                  className="p-2 rounded-lg text-[var(--color-neutral-400)] hover:text-danger-600 hover:bg-danger-50 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="bg-[var(--color-bg)] p-3 rounded-xl">
                  <div className="text-xs text-[var(--color-neutral-500)]">المورد</div>
                  <div className="font-bold text-[var(--color-fg)]">{payingPurchase.supplierName}</div>
                  <div className="text-xs text-[var(--color-neutral-500)] mt-1">فاتورة #{payingPurchase.id}</div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-info-500/10 p-2 rounded-lg">
                    <div className="text-xs text-[var(--color-neutral-500)]">الإجمالي</div>
                    <div className="font-bold text-info-500 text-sm">{payingPurchase.total.toLocaleString("ar-EG")}</div>
                  </div>
                  <div className="bg-success-100 p-2 rounded-lg">
                    <div className="text-xs text-[var(--color-neutral-500)]">المدفوع</div>
                    <div className="font-bold text-success-600 text-sm">{payingPurchase.paidAmount.toLocaleString("ar-EG")}</div>
                  </div>
                  <div className="bg-danger-50 p-2 rounded-lg">
                    <div className="text-xs text-[var(--color-neutral-500)]">المتبقي</div>
                    <div className="font-bold text-danger-600 text-sm">{payingPurchase.remaining.toLocaleString("ar-EG")}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">المبلغ</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    min={0.01}
                    max={payingPurchase.remaining}
                    step={0.01}
                    className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none text-lg font-bold text-center"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setPayAmount(payingPurchase.remaining)}
                      className="text-xs bg-primary-50 text-primary-600 px-3 py-1 rounded-lg font-bold hover:bg-primary-100"
                    >
                      المبلغ كامل
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayAmount(payingPurchase.remaining / 2)}
                      className="text-xs bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)] px-3 py-1 rounded-lg font-bold hover:bg-neutral-200"
                    >
                      النصف
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">طريقة الدفع</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                  >
                    <option value="CASH">كاش</option>
                    <option value="CARD">فيزا / بطاقة</option>
                    <option value="BANK">تحويل بنكي</option>
                  </select>
                </div>

                {paymentMethod === "CASH" && cashboxes.length > 0 && (
                  <div>
                    <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5 flex items-center gap-1.5">
                      <Wallet size={14} className="text-[var(--color-neutral-400)]" /> الخزنة
                    </label>
                    <select
                      value={selectedCashbox}
                      onChange={(e) => setSelectedCashbox(e.target.value)}
                      className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                    >
                      <option value="">بدون خزنة</option>
                      {cashboxes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.balance.toLocaleString("ar-EG")} ج.م)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">ملاحظات (اختياري)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                    placeholder="مثال: دفعة أولى"
                  />
                </div>

                <button
                  onClick={handleSubmitPayment}
                  disabled={submitting || payAmount <= 0}
                  className="w-full bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 active:scale-[0.97] transition-all disabled:opacity-50 shadow-sm shadow-primary-200 flex items-center justify-center gap-2"
                >
                  <Check size={18} /> {submitting ? "جاري الحفظ..." : `تسديد ${payAmount.toLocaleString("ar-EG")} ج.م`}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}