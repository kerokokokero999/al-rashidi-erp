"use client";

import { useState, useEffect } from "react";
import Header from "../../components/Header";
import { Users, Plus, Edit, Trash2, Shield, Mail, Search, UserCheck } from "lucide-react";
import Link from "next/link";
import { showSuccess, showError, showConfirm } from "@/utils/alerts";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  permissions: string | null;
};

const permissionLabels: Record<string, string> = {
  "/admin/dashboard": "لوحة التحكم",
  "/pos": "الكاشير",
  "/products": "المنتجات",
  "/invoices": "الفواتير",
  "/purchases": "المشتريات",
  "/purchases/manage": "طلبات الشراء المعلقة",
  "/purchases/log": "سجل المشتريات",
  "/suppliers": "الموردين",
  "/customers": "العملاء",
  "/employees": "الموظفين",
  "/users": "المستخدمين",
  "/orders": "الطلبات",
  "/returns": "المرتجعات",
  "/returns-log": "سجل المرتجعات",
  "/reports": "التقارير",
  "/reports/advanced": "التقارير المتقدمة",
  "/reports/all": "التقارير الشاملة",
  "/expenses": "المصروفات",
  "/settings": "الإعدادات",
  "/settings/categories": "الأقسام والوحدات",
  "/backup": "النسخ الاحتياطي",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) setUsers(await res.json());
    } catch {
      showError("حدث خطأ في جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm(
      "حذف مستخدم",
      "هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذه العملية."
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        showSuccess("تم حذف المستخدم");
        fetchUsers();
      } else {
        showError("حدث خطأ أثناء الحذف");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    }
  };

  const filtered = users.filter((u) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term))
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
              <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">إدارة المستخدمين</h1>
              <p className="text-sm text-[var(--color-neutral-500)] mt-1">{users.length} مستخدم مسجل</p>
            </div>
          </div>
          <Link
            href="/users/add"
            className="bg-primary-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-600 active:scale-[0.97] transition-all shadow-sm shadow-primary-200"
          >
            <Plus size={18} /> إضافة مستخدم
          </Link>
        </div>

        {/* Search */}
        <div className="mb-4 animate-slide-up">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]" size={18} />
            <input
              type="text"
              placeholder="ابحث بالاسم أو البريد الإلكتروني..."
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
                <th className="p-4 font-bold">المستخدم</th>
                <th className="p-4 font-bold">البريد الإلكتروني</th>
                <th className="p-4 font-bold">الدور</th>
                <th className="p-4 font-bold">الصلاحيات</th>
                <th className="p-4 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <Users className="mx-auto text-neutral-300 mb-3" size={48} />
                    <p className="text-[var(--color-neutral-500)]">
                      {search ? "لا توجد نتائج مطابقة." : "لا يوجد مستخدمين."}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const perms = user.permissions ? JSON.parse(user.permissions) : [];
                  return (
                    <tr key={user.id} className="hover:bg-primary-50/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                            <UserCheck size={16} className="text-primary-600" />
                          </div>
                          <span className="font-bold text-[var(--color-fg)]">
                            {user.name || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-[var(--color-neutral-600)]">
                        <span className="inline-flex items-center gap-1.5" dir="ltr">
                          <Mail size={14} className="text-[var(--color-neutral-400)]" />
                          {user.email}
                        </span>
                      </td>
                      <td className="p-4">
                        {user.role === "ADMIN" ? (
                          <span className="bg-primary-100 text-primary-700 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                            <Shield size={12} /> مدير
                          </span>
                        ) : user.role === "CASHIER" ? (
                          <span className="bg-info-500/10 text-info-500 px-2.5 py-1 rounded-lg text-xs font-bold">
                            كاشير
                          </span>
                        ) : user.role === "ACCOUNTANT" ? (
                          <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                            محاسب
                          </span>
                        ) : (
                          <span className="bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)] px-2.5 py-1 rounded-lg text-xs font-bold">
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-[var(--color-neutral-600)] max-w-xs">
                        {perms.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {perms.slice(0, 3).map((p: string) => (
                              <span
                                key={p}
                                className="bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)] px-2 py-0.5 rounded text-xs"
                              >
                                {permissionLabels[p] || p}
                              </span>
                            ))}
                            {perms.length > 3 && (
                              <span className="bg-[var(--color-neutral-100)] text-[var(--color-neutral-500)] px-2 py-0.5 rounded text-xs">
                                +{perms.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[var(--color-neutral-400)] text-xs">لا يوجد</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <Link
                            href={`/users/edit/${user.id}`}
                            className="p-2 bg-info-500/10 text-info-500 rounded-lg hover:bg-info-500/20 transition-colors"
                            title="تعديل"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={() => handleDelete(user.id)}
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
      </main>
    </>
  );
}