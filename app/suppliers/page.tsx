"use client";

import { useState, useEffect } from "react";
import Header from "../../components/Header";
import Link from "next/link";
import { Truck, Plus, Trash2, Edit, Search, Phone, Mail, Package } from "lucide-react";
import { showSuccess, showError, showConfirm } from "@/utils/alerts";

type Supplier = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  _count?: { purchases: number };
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers");
      if (res.ok) setSuppliers(await res.json());
    } catch {
      showError("حدث خطأ في جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSuppliers();
  }, []);

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm(
      "حذف مورد",
      "هل أنت متأكد من حذف هذا المورد؟ لا يمكن التراجع عن هذه العملية."
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      if (res.ok) {
        showSuccess("تم حذف المورد");
        fetchSuppliers();
      } else {
        showError("حدث خطأ (ربما المورد مرتبط بمشتريات)");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    }
  };

  const filtered = suppliers.filter((s) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      s.name.toLowerCase().includes(term) ||
      s.phone.includes(term) ||
      (s.email && s.email.toLowerCase().includes(term))
    );
  });

  if (loading)
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-pulse-soft">
          <Truck className="text-primary-500 mx-auto mb-4" size={48} />
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
              <Truck className="text-primary-600" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">إدارة الموردين</h1>
              <p className="text-sm text-[var(--color-neutral-500)] mt-1">{suppliers.length} مورد مسجل</p>
            </div>
          </div>
          <Link
            href="/suppliers/add"
            className="bg-primary-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-600 active:scale-[0.97] transition-all shadow-sm shadow-primary-200"
          >
            <Plus size={18} /> إضافة مورد
          </Link>
        </div>

        {/* Search */}
        <div className="mb-4 animate-slide-up">
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
                <th className="p-4 font-bold">اسم المورد</th>
                <th className="p-4 font-bold">رقم التليفون</th>
                <th className="p-4 font-bold">الإيميل</th>
                <th className="p-4 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center">
                    <Truck className="mx-auto text-neutral-300 mb-3" size={48} />
                    <p className="text-[var(--color-neutral-500)]">
                      {search ? "لا توجد نتائج مطابقة." : "لا يوجد موردين."}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                          <Truck size={16} className="text-primary-600" />
                        </div>
                        <span className="font-bold text-[var(--color-fg)]">{s.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-[var(--color-neutral-600)]">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone size={14} className="text-[var(--color-neutral-400)]" />
                        {s.phone}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-[var(--color-neutral-500)]">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail size={14} className="text-[var(--color-neutral-400)]" />
                        {s.email || "—"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <Link
                          href={`/suppliers/edit/${s.id}`}
                          className="p-2 bg-info-500/10 text-info-500 rounded-lg hover:bg-info-500/20 transition-colors"
                          title="تعديل"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(s.id)}
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