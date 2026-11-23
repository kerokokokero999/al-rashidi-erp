"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "../../../components/Header";
import Link from "next/link";
import { ArrowRight, Phone, MapPin, User, Clock, CheckCircle, XCircle, Package, AlertCircle, StickyNote, ShoppingBag } from "lucide-react";
import { showError } from "@/utils/alerts";

type OrderItem = {
  localId: number;
  name: string;
  sellPrice: number;
  quantity: number;
  image?: string | null;
};

type Order = {
  id: number;
  onlineOrderId: number | null;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: string;
  total: number;
  status: string;
  notes: string | null;
  createdAt: string;
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.id);

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) {
          if (res.status === 404) {
            router.push("/orders");
            return;
          }
          throw new Error("فشل جلب الطلب");
        }
        const data = await res.json();
        setOrder(data);

        try {
          const parsedItems = JSON.parse(data.items || "[]");
          setItems(Array.isArray(parsedItems) ? parsedItems : []);
        } catch {
          setItems([]);
        }
      } catch {
        showError("حدث خطأ في جلب تفاصيل الطلب");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId, router]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "PENDING":
        return { label: "قيد الانتظار", color: "bg-orange-100 text-orange-700", icon: Clock };
      case "PREPARING":
        return { label: "قيد التجهيز", color: "bg-info-500/10 text-info-500", icon: Package };
      case "DELIVERED":
        return { label: "تم التوصيل", color: "bg-success-100 text-success-700", icon: CheckCircle };
      case "CANCELLED":
        return { label: "ملغي", color: "bg-danger-50 text-danger-700", icon: XCircle };
      default:
        return { label: status, color: "bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]", icon: AlertCircle };
    }
  };

  if (loading)
    return (
      <>
        <Header />
        <div className="text-center py-20">
          <div className="inline-block animate-pulse-soft">
            <ShoppingBag className="text-primary-500 mx-auto mb-4" size={48} />
            <p className="text-[var(--color-neutral-500)] font-bold">جاري التحميل...</p>
          </div>
        </div>
      </>
    );

  if (!order)
    return (
      <>
        <Header />
        <div className="text-center py-20 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[var(--color-neutral-100)] mb-4">
            <ShoppingBag className="text-[var(--color-neutral-400)]" size={48} />
          </div>
          <p className="text-[var(--color-neutral-500)] text-lg mb-4">الطلب غير موجود</p>
          <Link href="/orders" className="text-primary-600 font-bold hover:underline">
            ← العودة للطلبات
          </Link>
        </div>
      </>
    );

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-[var(--color-neutral-500)] hover:text-primary-600 mb-6 font-bold hover:bg-primary-50 transition-all px-3 py-2 rounded-lg -mx-3"
        >
          <ArrowRight size={18} /> العودة للطلبات
        </Link>

        {/* Order Header */}
        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] p-6 mb-6 animate-slide-up">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-[var(--color-fg)] mb-2">
                طلب #{order.onlineOrderId || order.id}
              </h1>
              <p className="text-sm text-[var(--color-neutral-500)] flex items-center gap-1.5">
                <Clock size={14} /> {new Date(order.createdAt).toLocaleString("ar-EG")}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${statusInfo.color}`}>
              <StatusIcon size={18} /> {statusInfo.label}
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] p-6 mb-6 animate-slide-up">
          <h2 className="text-lg font-extrabold text-[var(--color-fg)] mb-4 flex items-center gap-2">
            <User className="text-primary-500" size={20} /> بيانات العميل
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-[var(--color-bg)] rounded-xl">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="text-primary-600" size={20} />
              </div>
              <div>
                <div className="text-xs text-[var(--color-neutral-500)]">الاسم</div>
                <div className="font-bold text-[var(--color-fg)]">{order.customerName}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[var(--color-bg)] rounded-xl">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Phone className="text-primary-600" size={20} />
              </div>
              <div>
                <div className="text-xs text-[var(--color-neutral-500)]">رقم التليفون</div>
                <a
                  href={`tel:${order.customerPhone}`}
                  className="font-bold text-[var(--color-fg)] hover:text-primary-600 transition-colors"
                  dir="ltr"
                >
                  {order.customerPhone}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[var(--color-bg)] rounded-xl">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="text-primary-600" size={20} />
              </div>
              <div>
                <div className="text-xs text-[var(--color-neutral-500)]">العنوان</div>
                <div className="font-bold text-[var(--color-fg)]">{order.customerAddress}</div>
              </div>
            </div>
            {order.notes && (
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <StickyNote className="text-orange-600" size={20} />
                </div>
                <div>
                  <div className="text-xs text-[var(--color-neutral-500)]">ملاحظات</div>
                  <div className="font-bold text-[var(--color-fg)]">{order.notes}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] p-6 mb-6 animate-slide-up">
          <h2 className="text-lg font-extrabold text-[var(--color-fg)] mb-4 flex items-center gap-2">
            <Package className="text-primary-500" size={20} /> المنتجات ({items.length})
          </h2>
          <div className="space-y-2">
            {items.length === 0 ? (
              <p className="text-[var(--color-neutral-500)] text-center py-4">لا توجد منتجات</p>
            ) : (
              items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-[var(--color-bg)] rounded-xl">
                  <div className="w-14 h-14 bg-[var(--color-card-bg)] rounded-xl flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden border border-[var(--color-card-border)]">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      "🛒"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[var(--color-fg)] truncate">{item.name}</div>
                    <div className="text-sm text-[var(--color-neutral-500)]">
                      {item.sellPrice.toLocaleString("ar-EG")} ج.م × {item.quantity}
                    </div>
                  </div>
                  <div className="font-bold text-success-600 text-lg whitespace-nowrap">
                    {(item.sellPrice * item.quantity).toFixed(2)} ج.م
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-[var(--color-card-border)] mt-4 pt-4 flex justify-between items-center">
            <span className="text-lg font-bold text-[var(--color-neutral-700)]">الإجمالي:</span>
            <span className="text-2xl font-extrabold text-success-600">
              {order.total.toLocaleString("ar-EG")} ج.م
            </span>
          </div>
        </div>

        <div className="text-center animate-slide-up">
          <Link
            href="/orders"
            className="inline-block bg-primary-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-600 active:scale-[0.97] transition-all shadow-sm shadow-primary-200"
          >
            ← العودة لكل الطلبات
          </Link>
        </div>
      </main>
    </>
  );
}