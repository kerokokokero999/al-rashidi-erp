"use client";

import { useState, useEffect } from "react";
import Header from "../../../components/Header";
import Link from "next/link";
import { ArrowRight, AlertTriangle, Plus, Trash2, Warehouse, Package, User, Calendar, FileText } from "lucide-react";
import { showSuccess, showError, showConfirm } from "@/utils/alerts";

type Product = {
  id: number;
  name: string;
  productUnits: { id: number; name: string; factor: number; isBase: boolean }[];
  productStocks: { warehouseId: number; stock: number }[];
};

type Warehouse = { id: number; name: string };

type DamagedProduct = {
  id: number;
  quantity: number;
  unitName: string | null;
  factor: number;
  reason: string | null;
  responsible: string | null;
  damageDate: string;
  product: { name: string };
  warehouse: { name: string };
};

export default function DamagedPage() {
  const [damages, setDamages] = useState<DamagedProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    warehouseId: "",
    productId: "",
    quantity: 1,
    unitId: "",
    reason: "",
    responsible: "",
  });

  const fetchData = async () => {
    try {
      const [dmgRes, prodRes, whRes] = await Promise.all([
        fetch("/api/warehouses/damaged"),
        fetch("/api/products"),
        fetch("/api/warehouses"),
      ]);
      if (dmgRes.ok) setDamages(await dmgRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (whRes.ok) setWarehouses(await whRes.json());
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

  const selectedProduct = products.find((p) => p.id === Number(formData.productId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.warehouseId || !formData.productId) {
      showError("اختر المخزن والمنتج");
      return;
    }

    const selectedUnit = selectedProduct?.productUnits.find((u) => u.id === Number(formData.unitId));
    const factor = selectedUnit?.factor || 1;

    setSubmitting(true);
    try {
      const res = await fetch("/api/warehouses/damaged", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseId: Number(formData.warehouseId),
          productId: Number(formData.productId),
          quantity: Number(formData.quantity),
          unitId: Number(formData.unitId) || null,
          unitName: selectedUnit?.name || null,
          factor,
          reason: formData.reason,
          responsible: formData.responsible,
        }),
      });

      if (res.ok) {
        showSuccess("تم تسجيل المنتج التالف");
        setFormData({ warehouseId: "", productId: "", quantity: 1, unitId: "", reason: "", responsible: "" });
        setIsAdding(false);
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
    showError("الحذف غير مدعوم — يمكن إضافة آلية عكس لاحقاً");
  };

  const totalDamaged = damages.reduce((sum, d) => sum + d.quantity * d.factor, 0);

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 animate-slide-down">
          <div className="flex items-center gap-3">
            <Link
              href="/warehouses"
              className="text-[var(--color-neutral-500)] hover:text-primary-600 hover:bg-primary-50 transition-colors p-2 rounded-lg"
            >
              <ArrowRight size={22} />
            </Link>
            <div className="p-3 rounded-xl bg-danger-50">
              <AlertTriangle className="text-danger-500" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">المنتجات التالفة</h1>
              <p className="text-sm text-[var(--color-neutral-500)] mt-1">
                {damages.length} سجل · إجمالي {totalDamaged} وحدة
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-primary-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-600 active:scale-[0.97] transition-all shadow-sm shadow-primary-200"
          >
            <Plus size={18} /> {isAdding ? "إلغاء" : "إضافة سجل تالف"}
          </button>
        </div>

        {isAdding && (
          <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-danger-100 mb-6 animate-slide-down">
            <h2 className="text-lg font-extrabold text-[var(--color-fg)] mb-4 flex items-center gap-2">
              <AlertTriangle className="text-danger-500" size={20} /> تسجيل منتج تالف
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                required
                className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
              >
                <option value="">اختر المخزن</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              <select
                value={formData.productId}
                onChange={(e) => {
                  const prod = products.find((p) => p.id === Number(e.target.value));
                  const baseUnit = prod?.productUnits.find((u) => u.isBase) || prod?.productUnits[0];
                  setFormData({ ...formData, productId: e.target.value, unitId: baseUnit?.id.toString() || "" });
                }}
                required
                className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
              >
                <option value="">اختر المنتج</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {selectedProduct && (
                <select
                  value={formData.unitId}
                  onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                  className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                >
                  {selectedProduct.productUnits.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} (×{u.factor})</option>
                  ))}
                </select>
              )}
              <input
                type="number"
                placeholder="الكمية"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                required
                min={1}
                className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
              />
              <input
                type="text"
                placeholder="سبب الإخراج"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
              />
              <input
                type="text"
                placeholder="المسؤول"
                value={formData.responsible}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="md:col-span-3 bg-danger-500 text-white py-3 rounded-xl font-bold hover:bg-danger-600 active:scale-[0.97] transition-all disabled:opacity-50 shadow-sm shadow-danger-200"
              >
                {submitting ? "جاري الحفظ..." : "حفظ السجل"}
              </button>
            </form>
          </div>
        )}

        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] overflow-x-auto animate-slide-up">
          <table className="w-full text-right">
            <thead className="bg-[var(--color-bg)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
              <tr>
                <th className="p-4 font-bold">المنتج</th>
                <th className="p-4 font-bold">المخزن</th>
                <th className="p-4 font-bold">الكمية</th>
                <th className="p-4 font-bold">السبب</th>
                <th className="p-4 font-bold">المسؤول</th>
                <th className="p-4 font-bold">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr><td colSpan={6} className="p-12 text-center text-[var(--color-neutral-500)]">جاري التحميل...</td></tr>
              ) : damages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <AlertTriangle className="mx-auto text-neutral-300 mb-3" size={48} />
                    <p className="text-[var(--color-neutral-500)]">لا توجد سجلات تالف.</p>
                  </td>
                </tr>
              ) : (
                damages.map((d) => (
                  <tr key={d.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="p-4 font-bold text-[var(--color-fg)]">{d.product.name}</td>
                    <td className="p-4 text-sm text-[var(--color-neutral-600)]">{d.warehouse.name}</td>
                    <td className="p-4 font-bold text-danger-600">
                      {d.quantity} {d.unitName || ""}
                      {d.factor > 1 && <span className="text-xs text-[var(--color-neutral-400)]"> (= {d.quantity * d.factor})</span>}
                    </td>
                    <td className="p-4 text-sm text-[var(--color-neutral-600)]">{d.reason || "—"}</td>
                    <td className="p-4 text-sm text-[var(--color-neutral-600)]">{d.responsible || "—"}</td>
                    <td className="p-4 text-sm text-[var(--color-neutral-500)]">
                      {new Date(d.damageDate).toLocaleDateString("ar-EG")}
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