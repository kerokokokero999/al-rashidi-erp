"use client";

import { useState, useEffect } from "react";
import Header from "../../components/Header";
import { Store, Plus, Edit, Trash2, X, Check, MapPin, Phone } from "lucide-react";
import { showSuccess, showError, showConfirm } from "@/utils/alerts";

type Branch = {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
};

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: "", address: "", phone: "" });
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const fetchBranches = async () => {
    const res = await fetch("/api/branches");
    if (res.ok) setBranches(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBranches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      showSuccess("تم إضافة الفرع");
      setFormData({ name: "", address: "", phone: "" });
      setIsAdding(false);
      fetchBranches();
    } else {
      showError("الاسم مسجل بالفعل");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;

    const res = await fetch(`/api/branches/${editingBranch.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      showSuccess("تم تعديل الفرع");
      setEditingBranch(null);
      setFormData({ name: "", address: "", phone: "" });
      fetchBranches();
    } else {
      showError("حدث خطأ أثناء التعديل");
    }
  };

  const openEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address || "",
      phone: branch.phone || "",
    });
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditingBranch(null);
    setFormData({ name: "", address: "", phone: "" });
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm(
      "هل أنت متأكد من حذف هذا الفرع؟",
      "سيتم حذف كل البيانات المرتبطة به."
    );
    if (!confirmed) return;

    const res = await fetch(`/api/branches/${id}`, { method: "DELETE" });
    if (res.ok) {
      showSuccess("تم حذف الفرع");
      fetchBranches();
    } else {
      showError("حدث خطأ (ربما الفرع مرتبط ببيانات)");
    }
  };

  if (loading)
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-pulse-soft">
          <Store className="text-primary-500 mx-auto mb-4" size={48} />
          <p className="text-[var(--color-neutral-500)] font-bold">جاري التحميل...</p>
        </div>
      </div>
    );

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-100">
              <Store className="text-primary-600" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">الفروع</h1>
              <p className="text-sm text-[var(--color-neutral-500)] mt-1">إدارة فروع النظام</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsAdding(!isAdding);
              setEditingBranch(null);
              setFormData({ name: "", address: "", phone: "" });
            }}
            className="bg-primary-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-600 active:scale-[0.97] transition-all shadow-sm shadow-primary-200"
          >
            <Plus size={18} /> {isAdding ? "إلغاء" : "إضافة فرع"}
          </button>
        </div>

        {/* Add form */}
        {isAdding && (
          <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-primary-100 mb-6 animate-slide-down">
            <h2 className="text-lg font-extrabold text-[var(--color-fg)] mb-4 flex items-center gap-2">
              <Plus className="text-primary-500" size={20} /> إضافة فرع جديد
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="اسم الفرع"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all"
              />
              <input
                type="text"
                placeholder="العنوان"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all"
              />
              <input
                type="text"
                placeholder="رقم التليفون"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all"
              />
              <button
                type="submit"
                className="md:col-span-3 bg-success-400 text-white py-3 rounded-xl font-bold hover:bg-success-500 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
              >
                <Check size={18} /> حفظ الفرع
              </button>
            </form>
          </div>
        )}

        {/* Edit form */}
        {editingBranch && (
          <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-info-500/30 mb-6 animate-slide-down">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-extrabold text-[var(--color-fg)]">
                تعديل الفرع: <span className="text-info-500">{editingBranch.name}</span>
              </h2>
              <button onClick={cancelEdit} className="text-[var(--color-neutral-400)] hover:text-danger-600 p-2 rounded-lg hover:bg-danger-50 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEdit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="اسم الفرع"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all"
              />
              <input
                type="text"
                placeholder="العنوان"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all"
              />
              <input
                type="text"
                placeholder="رقم التليفون"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all"
              />
              <button
                type="submit"
                className="md:col-span-3 bg-info-500 text-white py-3 rounded-xl font-bold hover:opacity-90 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
              >
                <Check size={18} /> حفظ التعديلات
              </button>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] overflow-hidden animate-slide-up">
          <table className="w-full text-right">
            <thead className="bg-[var(--color-bg)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
              <tr>
                <th className="p-4 font-bold">اسم الفرع</th>
                <th className="p-4 font-bold">العنوان</th>
                <th className="p-4 font-bold">التليفون</th>
                <th className="p-4 font-bold">الحالة</th>
                <th className="p-4 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {branches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <Store className="mx-auto text-neutral-300 mb-3" size={48} />
                    <p className="text-[var(--color-neutral-500)]">لا توجد فروع.</p>
                  </td>
                </tr>
              ) : (
                branches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="p-4 font-bold text-[var(--color-fg)]">{branch.name}</td>
                    <td className="p-4 text-sm text-[var(--color-neutral-600)]">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={14} className="text-[var(--color-neutral-400)]" />
                        {branch.address || "—"}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-[var(--color-neutral-600)]">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone size={14} className="text-[var(--color-neutral-400)]" />
                        {branch.phone || "—"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          branch.isActive
                            ? "bg-success-100 text-success-700"
                            : "bg-danger-50 text-danger-700"
                        }`}
                      >
                        {branch.isActive ? "نشط" : "غير نشط"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEdit(branch)}
                          className="p-2 bg-info-500/10 text-info-500 rounded-lg hover:bg-info-500/20 transition-colors"
                          title="تعديل"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(branch.id)}
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