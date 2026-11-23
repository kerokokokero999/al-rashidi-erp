"use client";

import { useState, useEffect } from "react";
import Header from "../../components/Header";
import { Warehouse, Plus, Edit, Trash2, Store, MapPin, Package, X, Check } from "lucide-react";
import Link from "next/link";
import { showSuccess, showError, showConfirm } from "@/utils/alerts";

type Branch = { id: number; name: string };
type Warehouse = {
  id: number;
  name: string;
  branchId: number;
  branch: Branch;
  isActive: boolean;
  createdAt: string;
  _count?: { productStocks: number };
};

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [formData, setFormData] = useState({ name: "", branchId: "" });

  const fetchData = async () => {
    try {
      const [whRes, brRes] = await Promise.all([
        fetch("/api/warehouses"),
        fetch("/api/branches"),
      ]);
      if (whRes.ok) setWarehouses(await whRes.json());
      if (brRes.ok) setBranches(await brRes.json());
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
    if (!formData.branchId) {
      showError("اختر الفرع");
      return;
    }

    const url = editing ? `/api/warehouses/${editing.id}` : "/api/warehouses";
    const method = editing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          branchId: Number(formData.branchId),
          isActive: true,
        }),
      });

      if (res.ok) {
        showSuccess(editing ? "تم التعديل" : "تم إضافة المخزن");
        setFormData({ name: "", branchId: "" });
        setIsAdding(false);
        setEditing(null);
        fetchData();
      } else {
        showError("حدث خطأ (ربما الاسم مكرر في نفس الفرع)");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm(
      "حذف مخزن",
      "هل أنت متأكد من حذف هذا المخزن؟ سيتم حذف كل أرصدة المنتجات المرتبطة به."
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/warehouses/${id}`, { method: "DELETE" });
      if (res.ok) {
        showSuccess("تم حذف المخزن");
        fetchData();
      } else {
        showError("حدث خطأ أثناء الحذف");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    }
  };

  const openEdit = (wh: Warehouse) => {
    setEditing(wh);
    setFormData({ name: wh.name, branchId: wh.branchId.toString() });
    setIsAdding(false);
  };

  const cancelForm = () => {
    setFormData({ name: "", branchId: "" });
    setIsAdding(false);
    setEditing(null);
  };

  if (loading)
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-pulse-soft">
          <Warehouse className="text-primary-500 mx-auto mb-4" size={48} />
          <p className="text-[var(--color-neutral-500)] font-bold">جاري التحميل...</p>
        </div>
      </div>
    );

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-100">
              <Warehouse className="text-primary-600" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">إدارة المخازن</h1>
              <p className="text-sm text-[var(--color-neutral-500)] mt-1">
                {warehouses.length} مخزن في {branches.length} فرع
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsAdding(!isAdding);
              setEditing(null);
              setFormData({ name: "", branchId: "" });
            }}
            className="bg-primary-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-600 active:scale-[0.97] transition-all shadow-sm shadow-primary-200"
          >
            <Plus size={18} /> {isAdding ? "إلغاء" : "إضافة مخزن"}
          </button>
        </div>

        {/* Links for Warehouse Operations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 animate-slide-up">
          <Link href="/warehouses/inventory" className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)] hover:border-primary-300 hover:shadow-md transition-all flex items-center gap-3 group">
            <div className="p-2.5 rounded-xl bg-info-500/10">
              <Package className="text-info-500" size={20} />
            </div>
            <div>
              <div className="font-bold text-[var(--color-fg)] group-hover:text-primary-600">جرد المخازن</div>
              <div className="text-xs text-[var(--color-neutral-500)]">عرض أرصدة المنتجات</div>
            </div>
          </Link>
          <Link href="/warehouses/transfer" className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)] hover:border-primary-300 hover:shadow-md transition-all flex items-center gap-3 group">
            <div className="p-2.5 rounded-xl bg-orange-100">
              <Warehouse className="text-orange-600" size={20} />
            </div>
            <div>
              <div className="font-bold text-[var(--color-fg)] group-hover:text-primary-600">تحويل المخازن</div>
              <div className="text-xs text-[var(--color-neutral-500)]">نقل منتجات بين المخازن</div>
            </div>
          </Link>
          <Link href="/warehouses/damaged" className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)] hover:border-primary-300 hover:shadow-md transition-all flex items-center gap-3 group">
            <div className="p-2.5 rounded-xl bg-danger-50">
              <X className="text-danger-500" size={20} />
            </div>
            <div>
              <div className="font-bold text-[var(--color-fg)] group-hover:text-primary-600">المنتجات التالفة</div>
              <div className="text-xs text-[var(--color-neutral-500)]">إخراج منتجات تالفة</div>
            </div>
          </Link>
        </div>

        {/* Add/Edit Form */}
        {(isAdding || editing) && (
          <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-primary-100 mb-6 animate-slide-down">
            <h2 className="text-lg font-extrabold text-[var(--color-fg)] mb-4 flex items-center gap-2">
              {editing ? <Edit className="text-info-500" size={20} /> : <Plus className="text-primary-500" size={20} />}
              {editing ? `تعديل: ${editing.name}` : "إضافة مخزن جديد"}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="اسم المخزن"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all"
              />
              <select
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                required
                className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
              >
                <option value="">اختر الفرع</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-primary-500 text-white py-3 rounded-xl font-bold hover:bg-primary-600 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                >
                  <Check size={18} /> {editing ? "حفظ التعديلات" : "حفظ"}
                </button>
                {(isAdding || editing) && (
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)] px-4 rounded-xl font-bold hover:bg-neutral-200 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] overflow-x-auto animate-slide-up">
          <table className="w-full text-right">
            <thead className="bg-[var(--color-bg)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
              <tr>
                <th className="p-4 font-bold">اسم المخزن</th>
                <th className="p-4 font-bold">الفرع</th>
                <th className="p-4 font-bold">الحالة</th>
                <th className="p-4 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {warehouses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center">
                    <Warehouse className="mx-auto text-neutral-300 mb-3" size={48} />
                    <p className="text-[var(--color-neutral-500)]">لا توجد مخازن. اضغط &quot;إضافة مخزن&quot; للبدء.</p>
                  </td>
                </tr>
              ) : (
                warehouses.map((wh) => (
                  <tr key={wh.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                          <Warehouse size={16} className="text-primary-600" />
                        </div>
                        <span className="font-bold text-[var(--color-fg)]">{wh.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-[var(--color-neutral-600)]">
                      <span className="inline-flex items-center gap-1.5">
                        <Store size={14} className="text-[var(--color-neutral-400)]" />
                        {wh.branch?.name || "—"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${wh.isActive ? "bg-success-100 text-success-700" : "bg-danger-50 text-danger-700"}`}>
                        {wh.isActive ? "نشط" : "غير نشط"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEdit(wh)}
                          className="p-2 bg-info-500/10 text-info-500 rounded-lg hover:bg-info-500/20 transition-colors"
                          title="تعديل"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(wh.id)}
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