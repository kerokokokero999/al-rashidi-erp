"use client";

import { useState, useEffect } from "react";
import Header from "../../../components/Header";
import { ShoppingBag, Trash2, Calendar, CheckCircle, Clock, Truck, Eye, X, Package, Warehouse, DollarSign, CreditCard } from "lucide-react";
import Link from "next/link";
import { showSuccess, showError, showConfirm } from "@/utils/alerts";

type PurchaseItem = {
  id: number;
  name: string;
  quantity: number;
  unitName: string | null;
  factor: number;
  costPrice: number;
  total: number;
  product?: { name: string };
  warehouse?: { name: string };
};

type Purchase = {
  id: number;
  total: number;
  status: string;
  paymentMethod: string;
  paidAmount: number;
  dueDate: string | null;
  supplierId: number | null;
  supplier: { name: string } | null;
  purchaseItems: PurchaseItem[];
  createdAt: string;
};

export default function PurchasesLogPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  const fetchPurchases = async () => {
    try {
      const res = await fetch("/api/purchases");
      if (res.ok) setPurchases(await res.json());
    } catch {
      showError("حدث خطأ في جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPurchases();
  }, []);

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm(
      "حذف طلب شراء",
      "هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذه العملية."
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/purchases/${id}`, { method: "DELETE" });
      if (res.ok) {
        showSuccess("تم حذف الطلب");
        fetchPurchases();
      } else {
        const data = await res.json();
        showError(data.error || "حدث خطأ أثناء الحذف");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    }
  };

  const filtered = filter === "ALL" ? purchases : purchases.filter((p) => p.status === filter);

  const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
  const totalPaid = purchases.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalRemaining = totalPurchases - totalPaid;

  if (loading)
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-pulse-soft">
          <ShoppingBag className="text-primary-500 mx-auto mb-4" size={48} />
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
              <ShoppingBag className="text-primary-600" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">سجل المشتريات</h1>
              <p className="text-sm text-[var(--color-neutral-500)] mt-1">{purchases.length} فاتورة</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 stagger-children">
          <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-100">
              <ShoppingBag className="text-primary-600" size={20} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-neutral-500)]">إجمالي المشتريات</div>
              <div className="text-xl font-extrabold text-[var(--color-fg)]">
                {totalPurchases.toLocaleString("ar-EG")} ج.م
              </div>
            </div>
          </div>
          <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success-100">
              <DollarSign className="text-success-600" size={20} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-neutral-500)]">المدفوع</div>
              <div className="text-xl font-extrabold text-success-600">
                {totalPaid.toLocaleString("ar-EG")} ج.م
              </div>
            </div>
          </div>
          <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-danger-50">
              <CreditCard className="text-danger-500" size={20} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-neutral-500)]">المتبقي</div>
              <div className="text-xl font-extrabold text-danger-600">
                {totalRemaining.toLocaleString("ar-EG")} ج.م
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap animate-slide-up">
          {[
            { key: "ALL", label: "الكل" },
            { key: "PENDING", label: "معلق" },
            { key: "RECEIVED", label: "تم الاستلام" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                filter === f.key
                  ? "bg-primary-500 text-white shadow-sm shadow-primary-200"
                  : "bg-[var(--color-card-bg)] text-[var(--color-neutral-600)] border border-[var(--color-neutral-200)] hover:border-primary-300 hover:text-primary-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] overflow-x-auto animate-slide-up">
          <table className="w-full text-right">
            <thead className="bg-[var(--color-bg)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
              <tr>
                <th className="p-4 font-bold">رقم الطلب</th>
                <th className="p-4 font-bold">التاريخ</th>
                <th className="p-4 font-bold">المورد</th>
                <th className="p-4 font-bold">الحالة</th>
                <th className="p-4 font-bold">طريقة الدفع</th>
                <th className="p-4 font-bold">الإجمالي</th>
                <th className="p-4 font-bold">المدفوع</th>
                <th className="p-4 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <ShoppingBag className="mx-auto text-neutral-300 mb-3" size={48} />
                    <p className="text-[var(--color-neutral-500)]">لا توجد مشتريات.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="p-4 font-mono text-sm text-primary-600 font-bold">#{purchase.id}</td>
                    <td className="p-4 text-sm text-[var(--color-neutral-600)]">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={14} className="text-[var(--color-neutral-400)]" />
                        {new Date(purchase.createdAt).toLocaleDateString("ar-EG")}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-[var(--color-neutral-700)]">
                      <span className="inline-flex items-center gap-1.5">
                        <Truck size={14} className="text-[var(--color-neutral-400)]" />
                        {purchase.supplier?.name || "—"}
                      </span>
                    </td>
                    <td className="p-4">
                      {purchase.status === "PENDING" ? (
                        <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                          <Clock size={12} /> معلق
                        </span>
                      ) : (
                        <span className="bg-success-100 text-success-700 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                          <CheckCircle size={12} /> مستلم
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          purchase.paymentMethod === "CASH"
                            ? "bg-success-100 text-success-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {purchase.paymentMethod === "CASH" ? "كاش" : "آجل"}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-primary-600">
                      {purchase.total.toLocaleString("ar-EG")} ج.م
                    </td>
                    <td className="p-4 font-bold text-success-600">
                      {purchase.paidAmount.toLocaleString("ar-EG")} ج.م
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setSelectedPurchase(purchase)}
                          className="p-2 bg-info-500/10 text-info-500 rounded-lg hover:bg-info-500/20 transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye size={16} />
                        </button>
                        {purchase.status === "PENDING" && (
                          <button
                            onClick={() => handleDelete(purchase.id)}
                            className="p-2 bg-danger-50 text-danger-600 rounded-lg hover:bg-danger-100 transition-colors"
                            title="حذف"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/purchases"
            className="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-600 active:scale-[0.97] transition-all shadow-sm shadow-primary-200"
          >
            + إضافة طلب شراء جديد
          </Link>
        </div>

        {/* Details Modal */}
        {selectedPurchase && (
          <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
              <div className="p-5 border-b border-[var(--color-card-border)] flex justify-between items-center sticky top-0 bg-[var(--color-card-bg)] z-10">
                <h2 className="text-lg font-extrabold text-[var(--color-fg)]">
                  تفاصيل الفاتورة #{selectedPurchase.id}
                </h2>
                <button
                  onClick={() => setSelectedPurchase(null)}
                  className="p-2 rounded-lg text-[var(--color-neutral-400)] hover:text-danger-600 hover:bg-danger-50 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--color-bg)] p-3 rounded-xl border border-[var(--color-card-border)]">
                    <div className="text-xs text-[var(--color-neutral-500)] mb-0.5">المورد</div>
                    <div className="font-bold text-sm text-[var(--color-fg)]">
                      {selectedPurchase.supplier?.name || "—"}
                    </div>
                  </div>
                  <div className="bg-[var(--color-bg)] p-3 rounded-xl border border-[var(--color-card-border)]">
                    <div className="text-xs text-[var(--color-neutral-500)] mb-0.5">التاريخ</div>
                    <div className="font-bold text-sm text-[var(--color-fg)]">
                      {new Date(selectedPurchase.createdAt).toLocaleDateString("ar-EG")}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[var(--color-neutral-700)] mb-2 flex items-center gap-1.5">
                    <Package size={14} /> الأصناف ({selectedPurchase.purchaseItems.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedPurchase.purchaseItems.map((item) => (
                      <div key={item.id} className="bg-[var(--color-bg)] p-3 rounded-xl border border-[var(--color-card-border)]">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-sm text-[var(--color-fg)]">
                              {item.product?.name || item.name}
                            </div>
                            <div className="text-xs text-[var(--color-neutral-500)] mt-0.5">
                              {item.quantity} {item.unitName || "وحدة"} × {item.costPrice} ج.م
                            </div>
                            {item.warehouse && (
                              <div className="text-xs text-info-500 mt-0.5 inline-flex items-center gap-1">
                                <Warehouse size={10} /> {item.warehouse.name}
                              </div>
                            )}
                          </div>
                          <div className="font-bold text-primary-600 text-sm">
                            {item.total.toFixed(2)} ج.م
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[var(--color-card-border)] pt-3 space-y-2">
                  <div className="flex justify-between text-sm text-[var(--color-neutral-600)]">
                    <span>الإجمالي:</span>
                    <span className="font-bold">{selectedPurchase.total.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                  <div className="flex justify-between text-sm text-success-600">
                    <span>المدفوع:</span>
                    <span className="font-bold">{selectedPurchase.paidAmount.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                  {selectedPurchase.total - selectedPurchase.paidAmount > 0 && (
                    <div className="flex justify-between text-sm text-danger-600">
                      <span>المتبقي:</span>
                      <span className="font-bold">
                        {(selectedPurchase.total - selectedPurchase.paidAmount).toLocaleString("ar-EG")} ج.م
                      </span>
                    </div>
                  )}
                  {selectedPurchase.dueDate && (
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>تاريخ الاستحقاق:</span>
                      <span className="font-bold">
                        {new Date(selectedPurchase.dueDate).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}