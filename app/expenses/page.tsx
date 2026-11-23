"use client";

import { useState, useEffect } from "react";
import Header from "../../components/Header";
import { Wallet, Plus, Trash2, Calendar, TrendingDown, Search } from "lucide-react";
import { showSuccess, showError, showConfirm } from "@/utils/alerts";

type Expense = {
  id: number;
  title: string;
  amount: number;
  createdAt: string;
};

type Cashbox = { id: number; name: string; balance: number };

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cashboxes, setCashboxes] = useState<Cashbox[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [selectedCashbox, setSelectedCashbox] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      const [expRes, cbRes] = await Promise.all([
        fetch("/api/expenses"),
        fetch("/api/cashboxes"),
      ]);
      if (expRes.ok) setExpenses(await expRes.json());
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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          amount,
          cashboxId: selectedCashbox ? Number(selectedCashbox) : null,
        }),
      });
      if (res.ok) {
        showSuccess("تم إضافة المصروف بنجاح");
        setTitle("");
        setAmount(0);
        fetchData();
      } else {
        const data = await res.json();
        showError(data.error || "حدث خطأ أثناء الإضافة");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm("حذف مصروف", "هل أنت متأكد من حذف هذا المصروف؟");
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) {
        showSuccess("تم حذف المصروف");
        fetchData();
      } else {
        showError("حدث خطأ في الحذف");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    }
  };

  const filtered = expenses.filter((exp) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return exp.title.toLowerCase().includes(term);
  });

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (loading)
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-pulse-soft">
          <Wallet className="text-primary-500 mx-auto mb-4" size={48} />
          <p className="text-[var(--color-neutral-500)] font-bold">جاري التحميل...</p>
        </div>
      </div>
    );

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-8 animate-slide-down">
          <div className="p-3 rounded-xl bg-danger-50">
            <Wallet className="text-danger-600" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">إدارة المصروفات</h1>
            <p className="text-sm text-[var(--color-neutral-500)] mt-1">سجل كل المصروفات</p>
          </div>
        </div>

        <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] mb-6 animate-slide-up">
          <h2 className="text-lg font-extrabold mb-4 flex items-center gap-2 text-[var(--color-fg)]">
            <Plus className="text-primary-500" size={20} /> إضافة مصروف جديد
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="اسم المصروف"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all"
            />
            <input
              type="number"
              placeholder="المبلغ (ج.م)"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all"
            />
            <select
              value={selectedCashbox}
              onChange={(e) => setSelectedCashbox(e.target.value)}
              className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
            >
              <option value="">بدون خزنة</option>
              {cashboxes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.balance.toLocaleString("ar-EG")} ج.م)
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={saving}
              className="bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 active:scale-[0.97] transition-all disabled:opacity-50 shadow-sm shadow-primary-200"
            >
              {saving ? "جاري الحفظ..." : "حفظ المصروف"}
            </button>
          </form>
        </div>

        <div className="mb-4 animate-slide-up">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]" size={18} />
            <input
              type="text"
              placeholder="ابحث في المصروفات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-2 border-[var(--color-neutral-200)] p-3 pr-10 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all"
            />
          </div>
        </div>

        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] overflow-hidden animate-slide-up">
          <div className="p-4 bg-[var(--color-bg)] border-b border-[var(--color-card-border)] flex justify-between items-center">
            <h2 className="font-extrabold text-[var(--color-neutral-700)]">سجل المصروفات</h2>
            <span className="text-danger-600 font-bold bg-danger-50 px-4 py-1.5 rounded-xl flex items-center gap-2">
              <TrendingDown size={16} />
              إجمالي المصروفات: {totalExpenses.toLocaleString("ar-EG")} ج.م
            </span>
          </div>
          <table className="w-full text-right">
            <thead className="bg-[var(--color-bg)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
              <tr>
                <th className="p-4 font-bold">اسم المصروف</th>
                <th className="p-4 font-bold">المبلغ</th>
                <th className="p-4 font-bold">التاريخ</th>
                <th className="p-4 font-bold text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center">
                    <Wallet className="mx-auto text-neutral-300 mb-3" size={48} />
                    <p className="text-[var(--color-neutral-500)]">
                      {search ? "لا توجد نتائج مطابقة." : "لا توجد مصروفات مسجلة."}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((exp) => (
                  <tr key={exp.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="p-4 font-bold text-[var(--color-fg)]">{exp.title}</td>
                    <td className="p-4 font-bold text-danger-600">
                      {exp.amount.toLocaleString("ar-EG")} ج.م
                    </td>
                    <td className="p-4 text-sm text-[var(--color-neutral-500)]">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={14} className="text-[var(--color-neutral-400)]" />
                        {new Date(exp.createdAt).toLocaleDateString("ar-EG")}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-2 bg-danger-50 text-danger-600 rounded-lg hover:bg-danger-100 transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}