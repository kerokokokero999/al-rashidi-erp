"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "../../../../components/Header";
import {
  Save,
  ArrowRight,
  User as UserIcon,
  Mail,
  Shield,
  Building2,
  Check,
  UserPen,
} from "lucide-react";
import Link from "next/link";
import { showSuccess, showError } from "@/utils/alerts";

type Branch = { id: number; name: string };

const pages = [
  { path: "/admin/dashboard", label: "لوحة التحكم" },
  { path: "/pos", label: "الكاشير (نقاط البيع)" },
  { path: "/products", label: "المنتجات" },
  { path: "/warehouses", label: "المخازن" },
  { path: "/invoices", label: "الفواتير" },
  { path: "/purchases", label: "المشتريات" },
  { path: "/purchases/manage", label: "طلبات الشراء المعلقة" },
  { path: "/purchases/log", label: "سجل المشتريات" },
  { path: "/suppliers", label: "الموردين" },
  { path: "/customers", label: "العملاء" },
  { path: "/employees", label: "الموظفين" },
  { path: "/users", label: "المستخدمين" },
  { path: "/orders", label: "الطلبات" },
  { path: "/returns", label: "المرتجعات" },
  { path: "/returns-log", label: "سجل المرتجعات" },
  { path: "/expenses", label: "المصروفات" },
  { path: "/settings", label: "الإعدادات" },
  { path: "/settings/categories", label: "الأقسام والوحدات" },
  { path: "/reports", label: "التقارير" },
  { path: "/reports/advanced", label: "التقارير المتقدمة" },
  { path: "/reports/all", label: "التقارير الشاملة" },
  { path: "/backup", label: "النسخ الاحتياطي" },
  { path: "/vouchers", label: "السندات (قبض/صرف)" },
  { path: "/tax", label: "الإقرار الضريبي" },
  { path: "/settings/printers", label: "إعدادات الطابعات" },
  { path: "/suppliers/payments", label: "تقرير مدفوعات الموردين" },
{ path: "/customers/payments", label: "تقرير مدفوعات العملاء" },
{ path: "/treasury/reports", label: "تقارير الخزنة" },
{ path: "/audit-log", label: "سجل النشاط" },
];

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "CASHIER",
    branchId: "",
  });
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${id}`);
        if (res.ok) {
          const data = await res.json();
          setFormData({
            name: data.name || "",
            email: data.email || "",
            role: data.role,
            branchId: data.branchId?.toString() || "",
          });
          if (data.permissions) {
            setPermissions(JSON.parse(data.permissions));
          }
        }
      } catch {
        showError("حدث خطأ أثناء جلب البيانات");
      } finally {
        setLoading(false);
      }
    };

    fetch("/api/branches")
      .then((res) => res.json())
      .then(setBranches)
      .catch(() => {});

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUser();
  }, [id]);

  const handlePermissionChange = (path: string) => {
    setPermissions((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const selectAllPermissions = () => {
    if (permissions.length === pages.length) {
      setPermissions([]);
    } else {
      setPermissions(pages.map((p) => p.path));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, permissions }),
      });

      if (res.ok) {
        showSuccess("تم تعديل المستخدم بنجاح!");
        router.push("/users");
        router.refresh();
      } else {
        showError("حدث خطأ أثناء التعديل");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-pulse-soft">
          <UserPen className="text-primary-500 mx-auto mb-4" size={48} />
          <p className="text-[var(--color-neutral-500)] font-bold">جاري التحميل...</p>
        </div>
      </div>
    );

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
        <div className="mb-6 flex items-center gap-3 animate-slide-down">
          <Link
            href="/users"
            className="text-[var(--color-neutral-500)] hover:text-primary-600 hover:bg-primary-50 transition-colors p-2 rounded-lg"
          >
            <ArrowRight size={22} />
          </Link>
          <div className="p-2.5 rounded-xl bg-info-500/10">
            <UserPen className="text-info-500" size={22} />
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--color-fg)]">تعديل بيانات المستخدم</h1>
        </div>

        <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* البيانات الأساسية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-2 flex items-center gap-1.5">
                  <UserIcon size={14} className="text-[var(--color-neutral-400)]" /> الاسم
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-2 flex items-center gap-1.5">
                  <Mail size={14} className="text-[var(--color-neutral-400)]" /> البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl bg-[var(--color-neutral-100)] text-left"
                  dir="ltr"
                />
                <p className="text-xs text-[var(--color-neutral-500)] mt-1">لا يمكن تغيير البريد الإلكتروني.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-2 flex items-center gap-1.5">
                  <Shield size={14} className="text-[var(--color-neutral-400)]" /> الدور الوظيفي
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                >
                  <option value="CASHIER">كاشير</option>
                  <option value="ACCOUNTANT">محاسب</option>
                  <option value="ADMIN">مدير</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-2 flex items-center gap-1.5">
                  <Building2 size={14} className="text-[var(--color-neutral-400)]" /> الفرع
                </label>
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                >
                  <option value="">بدون فرع (كل الفروع)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* الصلاحيات */}
            <div className="border-t border-[var(--color-card-border)] pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-extrabold text-[var(--color-fg)]">
                  الصلاحيات ({permissions.length}/{pages.length})
                </h2>
                <button
                  type="button"
                  onClick={selectAllPermissions}
                  className="text-sm font-bold text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {permissions.length === pages.length ? "إلغاء الكل" : "تحديد الكل"}
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {pages.map((page) => {
                  const isSelected = permissions.includes(page.path);
                  return (
                    <button
                      key={page.path}
                      type="button"
                      onClick={() => handlePermissionChange(page.path)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-bold text-right ${
                        isSelected
                          ? "border-primary-400 bg-primary-50 text-primary-700"
                          : "border-[var(--color-neutral-200)] hover:border-neutral-300 text-[var(--color-neutral-700)]"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? "bg-primary-500 text-white"
                            : "bg-[var(--color-card-bg)] border-2 border-neutral-300"
                        }`}
                      >
                        {isSelected && <Check size={14} />}
                      </div>
                      <span>{page.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-[var(--color-neutral-500)] mt-3">
                * إذا كان المستخدم مدير (ADMIN)، فسيتمكن من الوصول إلى كل الصفحات تلقائياً.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-info-500 text-white font-bold py-4 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
              <Save size={18} /> {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}