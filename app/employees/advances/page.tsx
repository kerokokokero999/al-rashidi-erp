"use client";

import { useState, useEffect } from "react";
import Header from "../../../components/Header";
import Link from "next/link";
import { ArrowRight, Wallet, Plus, Trash2, User, Calendar, X, Check, CreditCard } from "lucide-react";
import { showSuccess, showError, showConfirm } from "@/utils/alerts";

type Employee = { id: number; name: string; position: string };

type Advance = {
  id: number;
  personType: string;
  employeeId: number | null;
  personName: string | null;
  amount: number;
  paidAmount: number;
  advanceDate: string;
  dueDate: string | null;
  notes: string | null;
  employee?: { name: string } | null;
};

export default function AdvancesPage() {
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Payment Modal
  const [payingAdvance, setPayingAdvance] = useState<Advance | null>(null);
  const [payAmount, setPayAmount] = useState(0);

  const [formData, setFormData] = useState({
    personType: "EMPLOYEE" as "EMPLOYEE" | "PERSON",
    employeeId: "",
    personName: "",
    amount: 0,
    advanceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    notes: "",
  });

  const fetchData = async () => {
    try {
      const [advRes, empRes] = await Promise.all([
        fetch("/api/employees/advances"),
        fetch("/api/employees"),
      ]);
      if (advRes.ok) setAdvances(await advRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
    } catch {
      showError("حدث خطأ");
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
    if (formData.amount <= 0) {
      showError("أدخل مبلغ صحيح");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/employees/advances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showSuccess("تم تسجيل السلفة");
        setFormData({
          personType: "EMPLOYEE",
          employeeId: "",
          personName: "",
          amount: 0,
          advanceDate: new Date().toISOString().split("T")[0],
          dueDate: "",
          notes: "",
        });
        setShowForm(false);
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

  const handlePayment = async () => {
    if (!payingAdvance || payAmount <= 0) return;
    const remaining = payingAdvance.amount - payingAdvance.paidAmount;
    if (payAmount > remaining) {
      showError(`المبلغ أكبر من المتبقي (${remaining})`);
      return;
    }

    try {
      const res = await fetch(`/api/employees/advances/${payingAdvance.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidAmount: payAmount }),
      });
      if (res.ok) {
        showSuccess("تم تسجيل الدفعة");
        setPayingAdvance(null);
        setPayAmount(0);
        fetchData();
      } else {
        showError("حدث خطأ");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm("حذف السلفة", "هل أنت متأكد؟");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/employees/advances/${id}`, { method: "DELETE" });
      if (res.ok) {
        showSuccess("تم الحذف");
        fetchData();
      } else {
        showError("حدث خطأ");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    }
  };

  const totalRemaining = advances.reduce((sum, a) => sum + (a.amount - a.paidAmount), 0);

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
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 animate-slide-down">
          <div className="flex items-center gap-3">
            <Link href="/employees" className="text-[var(--color-neutral-500)] hover:text-primary-600 hover:bg-primary-50 transition-colors p-2 rounded-lg">
              <ArrowRight size={22} />
            </Link>
            <div className="p-3 rounded-xl bg-orange-100">
              <Wallet className="text-orange-600" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">السلفيات</h1>
              <p className="text-sm text-[var(--color-neutral-500)] mt-1">
                {advances.length} سلفة — متبقي {totalRemaining.toLocaleString("ar-EG")} ج.م
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-600 active:scale-[0.97] transition-all shadow-sm shadow-primary-200"
          >
            <Plus size={18} /> {showForm ? "إلغاء" : "إضافة سلفة"}
          </button>
        </div>

        {showForm && (
          <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-primary-100 mb-6 animate-slide-down">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-extrabold text-[var(--color-fg)]">تسجيل سلفة جديدة</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg text-[var(--color-neutral-400)] hover:text-danger-600 hover:bg-danger-50">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex gap-2 p-1.5 bg-[var(--color-bg)] rounded-xl md:col-span-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, personType: "EMPLOYEE" })}
                  className={`flex-1 px-4 py-2 rounded-lg font-bold text-sm ${
                    formData.personType === "EMPLOYEE" ? "bg-primary-500 text-white" : "text-[var(--color-neutral-600)]"
                  }`}
                >
                  <User size={14} className="inline mr-1" /> موظف
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, personType: "PERSON" })}
                  className={`flex-1 px-4 py-2 rounded-lg font-bold text-sm ${
                    formData.personType === "PERSON" ? "bg-primary-500 text-white" : "text-[var(--color-neutral-600)]"
                  }`}
                >
                  شخص عادي
                </button>
              </div>

              {formData.personType === "EMPLOYEE" ? (
                <select
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  required
                  className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                >
                  <option value="">اختر الموظف</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.name} - {e.position}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="اسم الشخص"
                  value={formData.personName}
                  onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                  required
                  className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                />
              )}

              <input
                type="number"
                placeholder="المبلغ"
                value={formData.amount || ""}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                required
                min={0.01}
                className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
              />

              <input
                type="date"
                value={formData.advanceDate}
                onChange={(e) => setFormData({ ...formData, advanceDate: e.target.value })}
                className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
              />

              <input
                type="date"
                placeholder="تاريخ الاستحقاق"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
              />

              <input
                type="text"
                placeholder="ملاحظات"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
              />

              <button
                type="submit"
                disabled={submitting}
                className="md:col-span-3 bg-primary-500 text-white py-3 rounded-xl font-bold hover:bg-primary-600 active:scale-[0.97] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check size={18} /> {submitting ? "جاري الحفظ..." : "حفظ السلفة"}
              </button>
            </form>
          </div>
        )}

        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] overflow-x-auto animate-slide-up">
          <table className="w-full text-right">
            <thead className="bg-[var(--color-bg)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
              <tr>
                <th className="p-4 font-bold">النوع</th>
                <th className="p-4 font-bold">الاسم</th>
                <th className="p-4 font-bold">المبلغ</th>
                <th className="p-4 font-bold">المدفوع</th>
                <th className="p-4 font-bold">المتبقي</th>
                <th className="p-4 font-bold">تاريخ السلف</th>
                <th className="p-4 font-bold">الاستحقاق</th>
                <th className="p-4 font-bold">ملاحظات</th>
                <th className="p-4 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {advances.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <Wallet className="mx-auto text-neutral-300 mb-3" size={48} />
                    <p className="text-[var(--color-neutral-500)]">لا توجد سلفيات.</p>
                  </td>
                </tr>
              ) : (
                advances.map((a) => {
                  const remaining = a.amount - a.paidAmount;
                  const isPaid = remaining <= 0;
                  return (
                    <tr key={a.id} className="hover:bg-primary-50/30 transition-colors">
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${a.personType === "EMPLOYEE" ? "bg-primary-100 text-primary-700" : "bg-info-500/10 text-info-500"}`}>
                          {a.personType === "EMPLOYEE" ? "موظف" : "شخص"}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-[var(--color-fg)]">
                        {a.employee?.name || a.personName || "—"}
                      </td>
                      <td className="p-4 font-bold">{a.amount.toLocaleString("ar-EG")} ج.م</td>
                      <td className="p-4 font-bold text-success-600">{a.paidAmount.toLocaleString("ar-EG")} ج.م</td>
                      <td className={`p-4 font-bold ${isPaid ? "text-success-600" : "text-danger-600"}`}>
                        {remaining.toLocaleString("ar-EG")} ج.م
                      </td>
                      <td className="p-4 text-sm text-[var(--color-neutral-500)]">
                        {new Date(a.advanceDate).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="p-4 text-sm text-[var(--color-neutral-500)]">
                        {a.dueDate ? new Date(a.dueDate).toLocaleDateString("ar-EG") : "—"}
                      </td>
                      <td className="p-4 text-sm text-[var(--color-neutral-500)]">{a.notes || "—"}</td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          {!isPaid && (
                            <button
                              onClick={() => { setPayingAdvance(a); setPayAmount(remaining); }}
                              className="p-2 bg-success-100 text-success-600 rounded-lg hover:bg-success-200 transition-colors"
                              title="تسديد"
                            >
                              <CreditCard size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="p-2 bg-danger-50 text-danger-600 rounded-lg hover:bg-danger-100 transition-colors"
                            title="حذف"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Payment Modal */}
        {payingAdvance && (
          <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
              <div className="p-5 border-b border-[var(--color-card-border)] flex justify-between items-center">
                <h2 className="text-lg font-extrabold text-[var(--color-fg)]">تسديد سلفة</h2>
                <button onClick={() => setPayingAdvance(null)} className="p-2 rounded-lg text-[var(--color-neutral-400)] hover:text-danger-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-3">
                <div className="bg-[var(--color-bg)] p-3 rounded-xl text-sm">
                  <div className="text-xs text-[var(--color-neutral-500)]">المتبقي</div>
                  <div className="font-extrabold text-danger-600 text-xl">
                    {(payingAdvance.amount - payingAdvance.paidAmount).toLocaleString("ar-EG")} ج.م
                  </div>
                </div>
                <input
                  type="number"
                  value={payAmount || ""}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none text-center font-bold text-lg"
                  placeholder="المبلغ"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setPayAmount(payingAdvance.amount - payingAdvance.paidAmount)}
                    className="flex-1 text-xs bg-primary-50 text-primary-600 px-3 py-2 rounded-lg font-bold hover:bg-primary-100"
                  >
                    كامل
                  </button>
                  <button
                    onClick={() => setPayAmount((payingAdvance.amount - payingAdvance.paidAmount) / 2)}
                    className="flex-1 text-xs bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)] px-3 py-2 rounded-lg font-bold hover:bg-neutral-200"
                  >
                    النصف
                  </button>
                </div>
                <button
                  onClick={handlePayment}
                  disabled={payAmount <= 0}
                  className="w-full bg-success-400 text-white font-bold py-3 rounded-xl hover:bg-success-500 active:scale-[0.97] transition-all disabled:opacity-50"
                >
                  تسديد
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}