"use client";

import { useState, useEffect } from "react";
import Header from "../../components/Header";
import Link from "next/link";
import { Users, Plus, Trash2, Edit, UserCircle, Phone, Briefcase, Wallet, Calendar, Search } from "lucide-react";
import { showSuccess, showError, showConfirm } from "@/utils/alerts";

type Employee = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  position: string;
  salary: number;
  hireDate: string;
  isActive: boolean;
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      if (res.ok) setEmployees(await res.json());
    } catch {
      showError("حدث خطأ في جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEmployees();
  }, []);

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm(
      "حذف موظف",
      "هل أنت متأكد من حذف هذا الموظف؟ لا يمكن التراجع عن هذه العملية."
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      if (res.ok) {
        showSuccess("تم حذف الموظف");
        fetchEmployees();
      } else {
        showError("حدث خطأ أثناء الحذف");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    }
  };

  const filtered = employees.filter((e) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      e.name.toLowerCase().includes(term) ||
      e.phone.includes(term) ||
      e.position.toLowerCase().includes(term)
    );
  });

  if (loading)
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-pulse-soft">
          <Users className="text-primary-500 mx-auto mb-4" size={48} />
          <p className="text-[var(--color-neutral-500)] font-bold">جاري التحميل...</p>
        </div>
      </div>
    );

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-100">
              <Users className="text-primary-600" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">إدارة الموظفين</h1>
              <p className="text-sm text-[var(--color-neutral-500)] mt-1">{employees.length} موظف مسجل</p>
            </div>
          </div>
          <Link
            href="/employees/add"
            className="bg-primary-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-600 active:scale-[0.97] transition-all shadow-sm shadow-primary-200"
          >
            <Plus size={18} /> إضافة موظف
          </Link>
        </div>

        {/* Search */}
        <div className="mb-5 animate-slide-up">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]" size={18} />
            <input
              type="text"
              placeholder="ابحث بالاسم أو التليفون أو الوظيفة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-2 border-[var(--color-neutral-200)] p-3 pr-10 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] overflow-x-auto animate-slide-up">
          <table className="w-full text-right">
            <thead className="bg-[var(--color-bg)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
              <tr>
                <th className="p-4 font-bold">الموظف</th>
                <th className="p-4 font-bold">رقم التليفون</th>
                <th className="p-4 font-bold">الوظيفة</th>
                <th className="p-4 font-bold">الراتب</th>
                <th className="p-4 font-bold">تاريخ التعيين</th>
                <th className="p-4 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <Users className="mx-auto text-neutral-300 mb-3" size={48} />
                    <p className="text-[var(--color-neutral-500)]">
                      {search ? "لا توجد نتائج مطابقة." : "لا يوجد موظفين."}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                          <UserCircle size={20} className="text-primary-600" />
                        </div>
                        <div>
                          <div className="font-bold text-[var(--color-fg)]">{emp.name}</div>
                          {emp.email && (
                            <div className="text-xs text-[var(--color-neutral-500)]" dir="ltr">
                              {emp.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-[var(--color-neutral-600)]">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone size={14} className="text-[var(--color-neutral-400)]" />
                        {emp.phone}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 bg-info-500/10 text-info-500 px-2.5 py-1 rounded-lg text-xs font-bold">
                        <Briefcase size={12} />
                        {emp.position}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-success-600">
                      <span className="inline-flex items-center gap-1.5">
                        <Wallet size={14} />
                        {emp.salary.toLocaleString("ar-EG")} ج.م
                      </span>
                    </td>
                    <td className="p-4 text-sm text-[var(--color-neutral-500)]">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={14} className="text-[var(--color-neutral-400)]" />
                        {new Date(emp.hireDate).toLocaleDateString("ar-EG")}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <Link
                          href={`/employees/edit/${emp.id}`}
                          className="p-2 bg-info-500/10 text-info-500 rounded-lg hover:bg-info-500/20 transition-colors"
                          title="تعديل"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="p-2 bg-danger-50 text-danger-600 rounded-lg hover:bg-danger-100 transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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