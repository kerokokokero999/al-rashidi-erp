"use client";

import { useState, useEffect } from "react";
import Header from "../../components/Header";
import { ShoppingBag, CheckCircle, XCircle, Clock, Eye, Trash2, User, Phone, MapPin, Package } from "lucide-react";
import Link from "next/link";
import { showSuccess, showError, showConfirm } from "@/utils/alerts";

type OrderItem = {
  id: number;
  name: string;
  quantity: number;
  sellPrice: number;
};

type Order = {
  id: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: string;
  total: number;
  status: string;
  createdAt: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [filter, setFilter] = useState<string>("ALL");

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) setOrders(await res.json());
    } catch {
      showError("حدث خطأ في جلب الطلبات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        showSuccess("تم تحديث حالة الطلب");
        fetchOrders();
      } else {
        showError("حدث خطأ");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    }
  };

  const deleteOrder = async (id: number) => {
    const confirmed = await showConfirm(
      "حذف الطلب",
      "هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع."
    );
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (res.ok) {
        showSuccess("تم حذف الطلب");
        setOrders((prev) => prev.filter((o) => o.id !== id));
      } else {
        showError("حدث خطأ في الحذف");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    } finally {
      setDeletingId(null);
    }
  };

  const deleteAllOrders = async () => {
    const confirmed = await showConfirm(
      "حذف كل الطلبات",
      "هل أنت متأكد من حذف كل الطلبات؟ لا يمكن التراجع عن هذه العملية."
    );
    if (!confirmed) return;

    setIsDeletingAll(true);
    try {
      const res = await fetch("/api/orders", { method: "DELETE" });
      if (res.ok) {
        showSuccess("تم حذف كل الطلبات");
        setOrders([]);
      } else {
        showError("حدث خطأ في الحذف");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    } finally {
      setIsDeletingAll(false);
    }
  };

  const filteredOrders = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: "قيد الانتظار", color: "text-orange-700", bg: "bg-orange-100" },
    PREPARING: { label: "قيد التجهيز", color: "text-info-500", bg: "bg-info-500/10" },
    DELIVERED: { label: "تم التوصيل", color: "text-success-700", bg: "bg-success-100" },
    CANCELLED: { label: "ملغي", color: "text-danger-700", bg: "bg-danger-50" },
  };

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
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-100">
              <ShoppingBag className="text-primary-600" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">الطلبات (من الموقع)</h1>
              <p className="text-sm text-[var(--color-neutral-500)] mt-1">{orders.length} طلب</p>
            </div>
          </div>
          {orders.length > 0 && (
            <button
              onClick={deleteAllOrders}
              disabled={isDeletingAll}
              className="bg-danger-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-danger-600 active:scale-[0.97] transition-all disabled:opacity-50 shadow-sm shadow-danger-200"
            >
              <Trash2 size={18} /> {isDeletingAll ? "جاري الحذف..." : "حذف كل الطلبات"}
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap animate-slide-up">
          {[
            { key: "ALL", label: "الكل" },
            { key: "PENDING", label: "قيد الانتظار" },
            { key: "PREPARING", label: "قيد التجهيز" },
            { key: "DELIVERED", label: "تم التوصيل" },
            { key: "CANCELLED", label: "ملغي" },
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

        {/* Orders */}
        <div className="space-y-4 stagger-children">
          {filteredOrders.length === 0 ? (
            <div className="bg-[var(--color-card-bg)] p-12 rounded-2xl text-center border border-[var(--color-card-border)]">
              <ShoppingBag className="mx-auto text-neutral-300 mb-3" size={56} />
              <p className="text-[var(--color-neutral-500)]">
                {filter === "ALL" ? "لا توجد طلبات حتى الآن." : "لا توجد طلبات بهذه الحالة."}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const parsedItems: OrderItem[] = JSON.parse(order.items as string);
              const status = statusConfig[order.status] || statusConfig.PENDING;

              return (
                <div
                  key={order.id}
                  className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] p-5 hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4 border-b border-[var(--color-card-border)] pb-3 flex-wrap gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <User className="text-primary-600" size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-[var(--color-fg)]">{order.customerName}</div>
                        <div className="text-sm text-[var(--color-neutral-500)] inline-flex items-center gap-1.5">
                          <Phone size={12} /> {order.customerPhone}
                        </div>
                        <div className="text-xs text-[var(--color-neutral-500)] inline-flex items-center gap-1.5 mt-0.5">
                          <MapPin size={12} /> {order.customerAddress}
                        </div>
                      </div>
                    </div>
                    <div className="text-left flex items-start gap-2">
                      <div>
                        <div className="font-mono text-sm text-primary-600 font-bold">#{order.id}</div>
                        <div className="text-xs text-[var(--color-neutral-500)]">
                          {new Date(order.createdAt).toLocaleString("ar-EG")}
                        </div>
                        <span
                          className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${status.bg} ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteOrder(order.id)}
                        disabled={deletingId === order.id}
                        className="text-[var(--color-neutral-400)] hover:text-danger-600 transition p-2 rounded-lg hover:bg-danger-50 disabled:opacity-50"
                        title="حذف الطلب"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-2 mb-4 bg-[var(--color-bg)] p-3 rounded-xl">
                    {parsedItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-[var(--color-neutral-700)]">
                          {item.name}{" "}
                          <span className="text-[var(--color-neutral-400)]">× {item.quantity}</span>
                        </span>
                        <span className="font-bold text-[var(--color-fg)]">
                          {(item.sellPrice * item.quantity).toLocaleString("ar-EG")} ج.م
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-center border-t border-[var(--color-card-border)] pt-4 flex-wrap gap-3">
                    <span className="text-xl font-extrabold text-success-600">
                      {order.total.toLocaleString("ar-EG")} ج.م
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      <Link
                        href={`/orders/${order.id}`}
                        className="bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)] px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-neutral-200 transition-colors text-sm"
                      >
                        <Eye size={16} /> التفاصيل
                      </Link>

                      {order.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => updateStatus(order.id, "PREPARING")}
                            className="bg-info-500/10 text-info-500 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-info-500/20 transition-colors text-sm"
                          >
                            <Clock size={16} /> قيد التجهيز
                          </button>
                          <button
                            onClick={() => updateStatus(order.id, "CANCELLED")}
                            className="bg-danger-50 text-danger-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-danger-100 transition-colors text-sm"
                          >
                            <XCircle size={16} /> إلغاء
                          </button>
                        </>
                      )}
                      {order.status === "PREPARING" && (
                        <button
                          onClick={() => updateStatus(order.id, "DELIVERED")}
                          className="bg-success-400 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-success-500 transition-all text-sm active:scale-[0.97]"
                        >
                          <CheckCircle size={16} /> تم التوصيل
                        </button>
                      )}
                      {order.status === "DELIVERED" && (
                        <span className="bg-success-100 text-success-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm">
                          <CheckCircle size={16} /> تم التوصيل
                        </span>
                      )}
                      {order.status === "CANCELLED" && (
                        <span className="bg-danger-50 text-danger-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm">
                          <XCircle size={16} /> ملغي
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </>
  );
}