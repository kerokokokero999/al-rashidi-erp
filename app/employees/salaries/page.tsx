"use client";

import { useState, useEffect } from "react";
import Header from "../../../components/Header";
import Link from "next/link";
import { ArrowRight, Banknote, Plus, Trash2, User, Calendar, X, Check } from "lucide-react";
import { showSuccess, showError, showConfirm } from "@/utils/alerts";

type Employee = {
  id: number;
  name: string;
  position: string;
  salary: number;
};

type SalaryPayment = {
  id: number;
  employeeId: number;
  salary: number;
  advancesDeducted: number;
  withdrawalsDeducted: number;
  netSalary: number;
  payDate: string;
  dueDate: string | null;
  notes: string | null;
  employee: { name: string; position: string };
};

export default function SalariesPage() {
  const [salaries, setSalaries] = useState<SalaryPayment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: "",
    salary: 0,
    advancesDeducted: 0,
    withdrawalsDeducted: 0,
    payDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    notes: "",
  });

  const fetchData = async () => {
    try {
      const [salRes, empRes] = await Promise.all([
        fetch("/api/employees/salaries"),
        fetch("/api/employees"),
      ]);
      if (salRes.ok) setSalaries(await salRes.json());
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

  const handleEmployeeChange = (employeeId: string) => {
    const emp = employees.find((e) => e.id === Number(employeeId));
    setFormData({
      ...formData,
      employeeId,
      salary: emp?.salary || 0,
    });
  };

  const netSalary = formData.salary - formData.advancesDeducted - formData.withdrawalsDeducted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || formData.salary <= 0) {
      showError("اختر الموظف وأدخل الراتب");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/employees/salaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showSuccess(`تم صرف راتب ${netSalary.toLocaleString("ar-EG")} ج.م`);
        setFormData({
          employeeId: "",
          salary: 0,
          advancesDeducted: 0,
          withdrawalsDeducted: 0,
          payDate: new Date().toISOString().split("T")[0],
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

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm("حذف سجل", "هل أنت متأكد؟");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/employees/salaries/${id}`, { method: "DELETE" });
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

  const totalPaid = salaries.reduce((sum, s) => sum + s.netSalary, 0);

  if (loading)
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-pulse-soft">
          <Banknote className="text-primary-500 mx-auto mb-4" size={48} />
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
            <div className="p-3 rounded-xl bg-success-100">
              <Banknote className="text-success-600" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">صرف المرتبات</h1>
              <p className="text-sm text-[var(--color-neutral-500)] mt-1">
                {salaries.length} عملية — إجمالي {totalPaid.toLocaleString("ar-EG")} ج.م
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-600 active:scale-[0.97] transition-all shadow-sm shadow-primary-200"
          >
            <Plus size={18} /> {showForm ? "إلغاء" : "صرف راتب"}
          </button>
        </div>

        {showForm && (
          <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-primary-100 mb-6 animate-slide-down">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-extrabold text-[var(--color-fg)]">صرف راتب جديد</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg text-[var(--color-neutral-400)] hover:text-danger-600 hover:bg-danger-50">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-3">
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">الموظف</label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  required
                  className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                >
                  <option value="">اختر الموظف</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.name} - {e.position}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">الراتب الشهري</label>
                <input
                  type="number"
                  value={formData.salary || ""}
                  onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                  required
                  min={0.01}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">خصم السلف</label>
                <input
                  type="number"
                  value={formData.advancesDeducted || ""}
                  onChange={(e) => setFormData({ ...formData, advancesDeducted: Number(e.target.value) })}
                  min={0}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">خصم المسحوبات</label>
                <input
                  type="number"
                  value={formData.withdrawalsDeducted || ""}
                  onChange={(e) => setFormData({ ...formData, withdrawalsDeducted: Number(e.target.value) })}
                  min={0}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">تاريخ الصرف</label>
                <input
                  type="date"
                  value={formData.payDate}
                  onChange={(e) => setFormData({ ...formData, payDate: e.target.value })}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">تاريخ الاستحقاق</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">ملاحظات</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                  placeholder="اختياري"
                />
              </div>

              <div className="md:col-span-3 bg-success-100 p-4 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-success-700">صافي الراتب:</span>
                  <span className="text-2xl font-extrabold text-success-600">
                    {netSalary.toLocaleString("ar-EG")} ج.م
                  </span>
                </div>
                <div className="text-xs text-success-600 mt-1 text-center">
                  ({formData.salary.toLocaleString("ar-EG")} - {formData.advancesDeducted.toLocaleString("ar-EG")} - {formData.withdrawalsDeducted.toLocaleString("ar-EG")})
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || netSalary < 0}
                className="md:col-span-3 bg-success-400 text-white py-3 rounded-xl font-bold hover:bg-success-500 active:scale-[0.97] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-success-200"
              >
                <Check size={18} /> {submitting ? "جاري الحفظ..." : `صرف ${netSalary.toLocaleString("ar-EG")} ج.م`}
              </button>
            </form>
          </div>
        )}

        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] overflow-x-auto animate-slide-up">
          <table className="w-full text-right">
            <thead className="bg-[var(--color-bg)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
              <tr>
                <th className="p-4 font-bold">الموظف</th>
                <th className="p-4 font-bold">الراتب</th>
                <th className="p-4 font-bold">خصم السلف</th>
                <th className="p-4 font-bold">خصم المسحوبات</th>
                <th className="p-4 font-bold">الصافي</th>
                <th className="p-4 font-bold">التاريخ</th>
                <th className="p-4 font-bold">ملاحظات</th>
                <th className="p-4 font-bold text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {salaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <Banknote className="mx-auto text-neutral-300 mb-3" size={48} />
                    <p className="text-[var(--color-neutral-500)]">لا توجد مرتبات مصروفة.</p>
                  </td>
                </tr>
              ) : (
                salaries.map((s) => (
                  <tr key={s.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-[var(--color-fg)]">{s.employee.name}</div>
                      <div className="text-xs text-[var(--color-neutral-500)]">{s.employee.position}</div>
                    </td>
                    <td className="p-4 text-sm text-[var(--color-neutral-700)]">{s.salary.toLocaleString("ar-EG")} ج.م</td>
                    <td className="p-4 text-sm text-danger-600">
                      {s.advancesDeducted > 0 ? `- ${s.advancesDeducted.toLocaleString("ar-EG")} ج.م` : "—"}
                    </td>
                    <td className="p-4 text-sm text-danger-600">
                      {s.withdrawalsDeducted > 0 ? `- ${s.withdrawalsDeducted.toLocaleString("ar-EG")} ج.م` : "—"}
                    </td>
                    <td className="p-4 font-bold text-success-600 text-lg">
                      {s.netSalary.toLocaleString("ar-EG")} ج.م
                    </td>
                    <td className="p-4 text-sm text-[var(--color-neutral-500)]">
                      {new Date(s.payDate).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="p-4 text-sm text-[var(--color-neutral-500)]">{s.notes || "—"}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(s.id)}
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