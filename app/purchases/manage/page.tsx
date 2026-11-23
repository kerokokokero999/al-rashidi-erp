"use client";

import { useState, useEffect } from "react";
import Header from "../../../components/Header";
import { CheckCircle, XCircle, Clock, Package, Truck, Warehouse, Trash2, DollarSign } from "lucide-react";
import { showSuccess, showError, showConfirm } from "@/utils/alerts";

type PurchaseItem = {
  id: number;
  name: string;
  quantity: number;
  unitName: string | null;
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
  supplier: { name: string } | null;
  purchaseItems: PurchaseItem[];
  createdAt: string;
};

export default function ManagePurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

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

  const approvePurchase = async (id: number) => {
    const confirmed = await showConfirm(
      "استلام بضاعة",
      "هل أنت متأكد من استلام البضاعة وتحديث المخزون؟"
    );
    if (!confirmed) return;

    setProcessing(id);
    try {
      const res = await fetch(`/api/purchases/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RECEIVED" }),
      });
      if (res.ok) {
        showSuccess("تم استلام البضاعة وتحديث المخزون!");
        fetchPurchases();
      } else {
        showError("حدث خطأ أثناء الاستلام");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    } finally {
      setProcessing(null);
    }
  };

  const rejectPurchase = async (id: number) => {
    const confirmed = await showConfirm(
      "رفض طلب شراء",
      "هل أنت متأكد من رفض هذا الطلب؟ لا يمكن التراجع عن هذه العملية."
    );
    if (!confirmed) return;

    setProcessing(id);
    try {
      const res = await fetch(`/api/purchases/${id}`, { method: "DELETE" });
      if (res.ok) {
        showSuccess("تم رفض الطلب");
        fetchPurchases();
      } else {
        showError("حدث خطأ أثناء الرفض");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    } finally {
      setProcessing(null);
    }
  };

  if (loading)
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-pulse-soft">
          <Clock className="text-primary-500 mx-auto mb-4" size={48} />
          <p className="text-[var(--color-neutral-500)] font-bold">جاري التحميل...</p>
        </div>
      </div>
    );

  const pendingPurchases = purchases.filter((p) => p.status === "PENDING");

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-6 animate-slide-down">
          <div className="p-3 rounded-xl bg-orange-100">
            <Clock className="text-orange-600" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">طلبات الشراء المعلقة</h1>
            <p className="text-sm text-[var(--color-neutral-500)] mt-1">
              {pendingPurchases.length} طلب في انتظار الاستلام
            </p>
          </div>
        </div>

        {pendingPurchases.length === 0 ? (
          <div className="bg-[var(--color-card-bg)] p-12 rounded-2xl text-center border border-[var(--color-card-border)] animate-slide-up">
            <CheckCircle className="mx-auto text-success-300 mb-3" size={56} />
            <p className="text-[var(--color-neutral-500)]">لا توجد طلبات شراء معلقة حالياً.</p>
          </div>
        ) : (
          <div className="space-y-4 stagger-children">
            {pendingPurchases.map((purchase) => (
              <div
                key={purchase.id}
                className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4 border-b border-[var(--color-card-border)] pb-3 flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-primary-600 font-bold">#{purchase.id}</span>
                      <span className="text-xs text-[var(--color-neutral-500)]">
                        {new Date(purchase.createdAt).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                    <div className="text-sm text-[var(--color-neutral-600)] inline-flex items-center gap-1.5">
                      <Truck size={14} className="text-[var(--color-neutral-400)]" />
                      {purchase.supplier?.name || "—"}
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="font-extrabold text-xl text-primary-600">
                      {purchase.total.toLocaleString("ar-EG")} ج.م
                    </span>
                    <div className="text-xs mt-1">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold ${
                          purchase.paymentMethod === "CASH"
                            ? "bg-success-100 text-success-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {purchase.paymentMethod === "CASH" ? "كاش" : "آجل"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4 bg-[var(--color-bg)] p-3 rounded-xl">
                  {purchase.purchaseItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <span className="text-[var(--color-neutral-700)] font-bold">{item.product?.name || item.name}</span>
                        {item.warehouse && (
                          <span className="text-xs text-info-500 inline-flex items-center gap-1 mr-2">
                            <Warehouse size={10} /> {item.warehouse.name}
                          </span>
                        )}
                        <span className="text-xs text-[var(--color-neutral-500)] mr-2">
                          ({item.quantity} {item.unitName || "وحدة"})
                        </span>
                      </div>
                      <span className="font-bold text-[var(--color-fg)]">{item.total.toFixed(2)} ج.م</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => rejectPurchase(purchase.id)}
                    disabled={processing === purchase.id}
                    className="bg-danger-50 text-danger-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-danger-100 transition-colors disabled:opacity-50 text-sm"
                  >
                    <XCircle size={16} /> رفض
                  </button>
                  <button
                    onClick={() => approvePurchase(purchase.id)}
                    disabled={processing === purchase.id}
                    className="bg-success-400 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-success-500 active:scale-[0.97] transition-all disabled:opacity-50 text-sm shadow-sm shadow-success-200"
                  >
                    <CheckCircle size={16} />
                    {processing === purchase.id ? "جاري الاستلام..." : "موافقة واستلام"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}