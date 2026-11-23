"use client";

import { useState, useEffect } from "react";
import Header from "../../components/Header";
import { UserPlus, Users, Phone, Mail, ReceiptText, TrendingUp, Edit, Trash2, Search } from "lucide-react";
import Link from "next/link";
import { showSuccess, showError, showConfirm } from "@/utils/alerts";

type Customer = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  createdAt: string;
  invoices: { id: number; total: number }[];
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch {
      showError("حدث خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCustomers();
  }, []);

  // ✅ derived value — مش state
  const filtered = customers.filter((c) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      c.name.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      (c.email ? c.email.toLowerCase().includes(term) : false)
    );
  });

  const handleDelete = async (id: number, name: string) => {
    const confirmed = await showConfirm(
      "حذف العميل",
      `هل أنت متأكد من حذف العميل "${name}"؟ سيتم حذف كل الفواتير المرتبطة به.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (res.ok) {
        showSuccess("تم حذف العميل");
        fetchCustomers();
      } else {
        showError("حدث خطأ أثناء الحذف (ربما العميل مرتبط بفواتير)");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    }
  };

  const totalSpentAll = customers.reduce(
    (sum, c) => sum + c.invoices.reduce((s, inv) => s + inv.total, 0),
    0
  );

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
              <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">سجل العملاء</h1>
              <p className="text-sm text-[var(--color-neutral-500)] mt-1">
                {customers.length} عميل — إجمالي مشتريات {totalSpentAll.toLocaleString("ar-EG")} ج.م
              </p>
            </div>
          </div>

          <Link
            href="/customers/add"
            className="bg-primary-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-600 active:scale-[0.97] transition-all shadow-sm shadow-primary-200"
          >
            <UserPlus size={18} />
            إضافة عميل جديد
          </Link>
        </div>

        {/* Search */}
        <div className="mb-5 animate-slide-up">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]" size={18} />
            <input
              type="text"
              placeholder="ابحث بالاسم أو التليفون أو الإيميل..."
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
                <th className="p-4 font-bold">اسم العميل</th>
                <th className="p-4 font-bold">رقم التليفون</th>
                <th className="p-4 font-bold">الإيميل</th>
                <th className="p-4 font-bold">عدد الفواتير</th>
                <th className="p-4 font-bold">إجمالي المشتريات</th>
                <th className="p-4 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <Users className="mx-auto text-neutral-300 mb-3" size={48} />
                    <p className="text-[var(--color-neutral-500)]">
                      {search ? "لا توجد نتائج مطابقة للبحث." : "لا يوجد عملاء حتى الآن."}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((customer) => {
                  const totalSpent = customer.invoices.reduce((sum, inv) => sum + inv.total, 0);
                  return (
                    <tr key={customer.id} className="hover:bg-primary-50/30 transition-colors">
                      <td className="p-4 font-bold text-[var(--color-fg)]">{customer.name}</td>
                      <td className="p-4 text-sm text-[var(--color-neutral-600)]">
                        <span className="inline-flex items-center gap-1.5">
                          <Phone size={14} className="text-[var(--color-neutral-400)]" />
                          {customer.phone}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-[var(--color-neutral-500)]">
                        <span className="inline-flex items-center gap-1.5">
                          <Mail size={14} className="text-[var(--color-neutral-400)]" />
                          {customer.email || "—"}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-[var(--color-neutral-600)]">
                        <span className="inline-flex items-center gap-1.5">
                          <ReceiptText size={14} className="text-[var(--color-neutral-400)]" />
                          {customer.invoices.length} فاتورة
                        </span>
                      </td>
                      <td className="p-4 font-bold text-success-600">
                        <span className="inline-flex items-center gap-1.5">
                          <TrendingUp size={14} />
                          {totalSpent.toLocaleString("ar-EG")} ج.م
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <Link
                            href={`/customers/edit/${customer.id}`}
                            className="p-2 bg-info-500/10 text-info-500 rounded-lg hover:bg-info-500/20 transition-colors"
                            title="تعديل"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={() => handleDelete(customer.id, customer.name)}
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