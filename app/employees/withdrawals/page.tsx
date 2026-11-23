"use client";

import { useState, useEffect } from "react";
import Header from "../../../components/Header";
import Link from "next/link";
import { ArrowRight, Package, Plus, Trash2, User, Warehouse, Calendar, X, Check } from "lucide-react";
import { showSuccess, showError, showConfirm } from "@/utils/alerts";

type Employee = { id: number; name: string; position: string };
type Product = {
  id: number;
  name: string;
  sellPrice: number;
  costPrice: number;
  productUnits: { id: number; name: string; factor: number; isBase: boolean }[];
};
type WarehouseType = { id: number; name: string };

type Withdrawal = {
  id: number;
  employeeId: number;
  productId: number;
  quantity: number;
  unitName: string | null;
  factor: number;
  price: number;
  total: number;
  withdrawalDate: string;
  notes: string | null;
  employee: { name: string };
  product: { name: string };
  warehouse?: { name: string } | null;
};

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: "",
    productId: "",
    warehouseId: "",
    quantity: 1,
    unitId: "",
    notes: "",
  });

  const fetchData = async () => {
    try {
      const [wRes, empRes, prodRes, whRes] = await Promise.all([
        fetch("/api/employees/withdrawals"),
        fetch("/api/employees"),
        fetch("/api/products"),
        fetch("/api/warehouses"),
      ]);
      if (wRes.ok) setWithdrawals(await wRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (whRes.ok) {
        const wh = await whRes.json();
        setWarehouses(wh);
        if (wh.length > 0) setFormData((prev) => ({ ...prev, warehouseId: wh[0].id.toString() }));
      }
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

  const selectedProduct = products.find((p) => p.id === Number(formData.productId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.productId) {
      showError("اختر الموظف والمنتج");
      return;
    }

    const selectedUnit = selectedProduct?.productUnits.find((u) => u.id === Number(formData.unitId));
    const factor = selectedUnit?.factor || 1;
    const price = selectedProduct?.sellPrice || 0;

    setSubmitting(true);
    try {
      const res = await fetch("/api/employees/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: Number(formData.employeeId),
          productId: Number(formData.productId),
          warehouseId: formData.warehouseId ? Number(formData.warehouseId) : null,
          quantity: Number(formData.quantity),
          unitId: Number(formData.unitId) || null,
          unitName: selectedUnit?.name || null,
          factor,
          price,
          notes: formData.notes,
        }),
      });

      if (res.ok) {
        showSuccess("تم تسجيل المسحوب");
        setFormData({ employeeId: "", productId: "", warehouseId: formData.warehouseId, quantity: 1, unitId: "", notes: "" });
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
    const confirmed = await showConfirm("حذف", "هل أنت متأكد؟");
    if (!confirmed) return;
    showError("الحذف غير مدعوم حالياً");
  };

  const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.total, 0);

  if (loading)
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-pulse-soft">
          <Package className="text-primary-500 mx-auto mb-4" size={48} />
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
              <Package className="text-orange-600" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">مسحوبات الموظفين</h1>
              <p className="text-sm text-[var(--color-neutral-500)] mt-1">
                {withdrawals.length} مسحوب — إجمالي {totalWithdrawals.toLocaleString("ar-EG")} ج.م
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-600 active:scale-[0.97] transition-all shadow-sm shadow-primary-200"
          >
            <Plus size={18} /> {showForm ? "إلغاء" : "إضافة مسحوب"}
          </button>
        </div>

        {showForm && (
          <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-primary-100 mb-6 animate-slide-down">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-extrabold text-[var(--color-fg)]">تسجيل مسحوب جديد</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg text-[var(--color-neutral-400)] hover:text-danger-600 hover:bg-danger-50">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              <select
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
              >
                <option value="">بدون مخزن</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
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
                <Check size={18} /> {submitting ? "جاري الحفظ..." : "حفظ"}
              </button>
            </form>
          </div>
        )}

        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] overflow-x-auto animate-slide-up">
          <table className="w-full text-right">
            <thead className="bg-[var(--color-bg)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
              <tr>
                <th className="p-4 font-bold">الموظف</th>
                <th className="p-4 font-bold">المنتج</th>
                <th className="p-4 font-bold">المخزن</th>
                <th className="p-4 font-bold">الكمية</th>
                <th className="p-4 font-bold">السعر</th>
                <th className="p-4 font-bold">الإجمالي</th>
                <th className="p-4 font-bold">التاريخ</th>
                <th className="p-4 font-bold">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <Package className="mx-auto text-neutral-300 mb-3" size={48} />
                    <p className="text-[var(--color-neutral-500)]">لا توجد مسحوبات.</p>
                  </td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="p-4 font-bold text-[var(--color-fg)]">{w.employee.name}</td>
                    <td className="p-4 text-[var(--color-neutral-700)]">{w.product.name}</td>
                    <td className="p-4 text-sm text-[var(--color-neutral-600)]">{w.warehouse?.name || "—"}</td>
                    <td className="p-4 font-bold">
                      {w.quantity} {w.unitName || ""}
                      {w.factor > 1 && <span className="text-xs text-[var(--color-neutral-400)]"> (= {w.quantity * w.factor})</span>}
                    </td>
                    <td className="p-4 text-sm text-[var(--color-neutral-600)]">{w.price.toLocaleString("ar-EG")} ج.م</td>
                    <td className="p-4 font-bold text-primary-600">{w.total.toLocaleString("ar-EG")} ج.م</td>
                    <td className="p-4 text-sm text-[var(--color-neutral-500)]">
                      {new Date(w.withdrawalDate).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="p-4 text-sm text-[var(--color-neutral-500)]">{w.notes || "—"}</td>
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