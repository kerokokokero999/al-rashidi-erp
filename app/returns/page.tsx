"use client";

import { useState } from "react";
import Header from "../../components/Header";
import {
  Search,
  RotateCcw,
  AlertTriangle,
  Package,
  DollarSign,
  CheckCircle,
  ReceiptText,
  ShoppingBag,
} from "lucide-react";
import { showSuccess, showError, showConfirm, showWarning } from "@/utils/alerts";

type InvoiceItem = {
  id: number;
  productId: number | null;
  name: string;
  quantity: number;
  sellPrice: number;
};

type Invoice = {
  id: number;
  items: InvoiceItem[];
  total: number;
};

type ReturnItem = {
  id: number;
  productId: number | null;
  name: string;
  quantity: number;
  maxQuantity: number;
  originalQuantity: number;
  alreadyReturned: number;
  sellPrice: number;
};

export default function ReturnsPage() {
  const [returnType, setReturnType] = useState<"SALE" | "PURCHASE">("SALE");
  const [invoiceId, setInvoiceId] = useState("");
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const searchInvoice = async () => {
    if (!invoiceId) {
      showError("أدخل رقم الفاتورة");
      return;
    }
    setLoading(true);
    try {
      const endpoint =
        returnType === "SALE"
          ? `/api/invoices/${invoiceId}`
          : `/api/purchases/${invoiceId}`;

      const res = await fetch(endpoint);
      if (!res.ok) {
        showError(returnType === "SALE" ? "فاتورة المبيعات غير موجودة" : "فاتورة المشتريات غير موجودة");
        setInvoice(null);
        return;
      }
      const data = await res.json();

      let items: InvoiceItem[] = [];
      if (returnType === "SALE") {
        items = (data.items || []).map((i: InvoiceItem) => ({
          id: i.id,
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          sellPrice: i.sellPrice,
        }));
      } else {
        if (data.status !== "RECEIVED") {
          showError("لا يمكن إرجاع فاتورة لم يتم استلامها");
          setInvoice(null);
          return;
        }
        items = (data.purchaseItems || []).map(
          (i: {
            id: number;
            productId: number;
            name?: string;
            quantity: number;
            costPrice: number;
            product?: { name: string };
          }) => ({
            id: i.id,
            productId: i.productId,
            name: i.product?.name || i.name || "",
            quantity: i.quantity,
            sellPrice: i.costPrice,
          })
        );
      }

      setInvoice({ id: data.id, items, total: data.total });

      // جلب المرتجعات السابقة
      const returnsParams =
        returnType === "SALE"
          ? `invoiceId=${invoiceId}&type=SALE`
          : `purchaseId=${invoiceId}&type=PURCHASE`;
      const returnsRes = await fetch(`/api/returns?${returnsParams}`);
      const previousReturns = returnsRes.ok ? await returnsRes.json() : [];

      const returnedQty: Record<number, number> = {};
      for (const ret of previousReturns) {
        try {
          const retItems = JSON.parse(ret.items);
          for (const item of retItems) {
            const pid = item.productId || item.id;
            if (pid) {
              returnedQty[pid] = (returnedQty[pid] || 0) + (item.quantity || 0);
            }
          }
        } catch (err) {
          console.error("Error parsing previous return:", err);
        }
      }

      const itemsData: ReturnItem[] = items.map((item) => {
        const pid = item.productId || 0;
        const alreadyReturned = returnedQty[pid] || 0;
        const maxQuantity = Math.max(0, item.quantity - alreadyReturned);
        return {
          id: item.id,
          productId: item.productId,
          name: item.name,
          quantity: maxQuantity,
          maxQuantity,
          originalQuantity: item.quantity,
          alreadyReturned,
          sellPrice: item.sellPrice,
        };
      });

      setReturnItems(itemsData);

      if (itemsData.every((i) => i.maxQuantity === 0)) {
        showWarning("كل منتجات الفاتورة دي اترجعت بالفعل");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  const updateReturnQty = (id: number, qty: number) => {
    setReturnItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const safeQty = Math.max(0, Math.min(qty, item.maxQuantity));
        return { ...item, quantity: safeQty };
      })
    );
  };

  const totalRefund = returnItems.reduce(
    (sum, item) => sum + item.sellPrice * item.quantity,
    0
  );

  const handleReturn = async () => {
    const itemsToReturn = returnItems.filter((item) => item.quantity > 0);
    if (itemsToReturn.length === 0) {
      showWarning("اختر منتجات للإرجاع");
      return;
    }

    const missingProductId = itemsToReturn.find((item) => !item.productId);
    if (missingProductId) {
      showError(`المنتج "${missingProductId.name}" مش مرتبط بمنتج في المخزون.`);
      return;
    }

    const invalid = itemsToReturn.find((item) => item.quantity > item.maxQuantity);
    if (invalid) {
      showError(`المنتج "${invalid.name}": الكمية أكبر من المتاح (${invalid.maxQuantity})`);
      return;
    }

    const confirmed = await showConfirm(
      "تأكيد الإرجاع",
      returnType === "SALE"
        ? "هل أنت متأكد من إرجاع هذه المنتجات؟ سيتم إرجاع الكمية للمخزون."
        : "هل أنت متأكد من إرجاع هذه المنتجات للمورد؟ سيتم خصم الكمية من المخزون."
    );
    if (!confirmed) return;

    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: returnType === "SALE" ? invoice?.id : null,
          purchaseId: returnType === "PURCHASE" ? invoice?.id : null,
          type: returnType,
          items: itemsToReturn.map((item) => ({
            id: item.id,
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            sellPrice: item.sellPrice,
          })),
          total: totalRefund,
          reason,
        }),
      });

      if (res.ok) {
        showSuccess(
          returnType === "SALE"
            ? "تم تسجيل المرتجع وإرجاع المنتجات للمخزون!"
            : "تم تسجيل مرتجع المشتريات وخصم المنتجات من المخزون!"
        );
        setInvoice(null);
        setInvoiceId("");
        setReturnItems([]);
        setReason("");
      } else {
        const errorData = await res.json().catch(() => ({}));
        showError(errorData.error || "حدث خطأ أثناء تسجيل المرتجع");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    }
  };

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-6 animate-slide-down">
          <div className="p-3 rounded-xl bg-orange-100">
            <RotateCcw className="text-orange-600" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">المرتجعات</h1>
            <p className="text-sm text-[var(--color-neutral-500)] mt-1">إرجاع منتجات من فاتورة سابقة</p>
          </div>
        </div>

        {/* Type Toggle */}
        <div className="flex gap-2 mb-6 bg-[var(--color-card-bg)] p-1.5 rounded-xl border border-[var(--color-card-border)] w-fit animate-slide-up">
          <button
            onClick={() => {
              setReturnType("SALE");
              setInvoice(null);
              setReturnItems([]);
            }}
            className={`px-5 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 text-sm ${
              returnType === "SALE"
                ? "bg-primary-500 text-white shadow-sm"
                : "text-[var(--color-neutral-500)] hover:text-primary-600"
            }`}
          >
            <ReceiptText size={16} /> مرتجع مبيعات
          </button>
          <button
            onClick={() => {
              setReturnType("PURCHASE");
              setInvoice(null);
              setReturnItems([]);
            }}
            className={`px-5 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 text-sm ${
              returnType === "PURCHASE"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-[var(--color-neutral-500)] hover:text-orange-600"
            }`}
          >
            <ShoppingBag size={16} /> مرتجع مشتريات
          </button>
        </div>

        {/* Search */}
        <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] mb-6 animate-slide-up">
          <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-2 flex items-center gap-1.5">
            <Search size={14} className="text-[var(--color-neutral-400)]" />
            رقم {returnType === "SALE" ? "فاتورة المبيعات" : "فاتورة المشتريات"}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchInvoice()}
              placeholder="أدخل رقم الفاتورة..."
              className="flex-1 border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all"
            />
            <button
              onClick={searchInvoice}
              disabled={loading}
              className="bg-primary-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-600 active:scale-[0.97] transition-all disabled:opacity-50 shadow-sm shadow-primary-200"
            >
              <Search size={18} /> {loading ? "..." : "بحث"}
            </button>
          </div>
        </div>

        {invoice && (
          <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] animate-slide-up">
            <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2 text-[var(--color-fg)]">
              <Package className="text-primary-500" size={20} /> منتجات الفاتورة
            </h2>

            <div className="space-y-3 mb-6">
              {returnItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 rounded-xl border ${
                    item.maxQuantity === 0
                      ? "bg-[var(--color-neutral-100)] border-[var(--color-neutral-200)] opacity-60"
                      : "bg-[var(--color-bg)] border-[var(--color-neutral-200)]"
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-bold text-[var(--color-fg)]">{item.name}</div>
                    <div className="text-sm text-primary-600 font-bold">
                      {item.sellPrice} ج.م
                    </div>
                    <div className="text-xs text-[var(--color-neutral-500)] mt-1 space-x-1 space-x-reverse">
                      <span>
                        الكمية الأصلية: <strong>{item.originalQuantity}</strong>
                      </span>
                      {item.alreadyReturned > 0 && (
                        <span>
                          {" "}
                          | اترجع قبل كده:{" "}
                          <strong className="text-orange-600">{item.alreadyReturned}</strong>
                        </span>
                      )}
                      <span>
                        {" "}
                        | المتاح:{" "}
                        <strong className="text-success-600">{item.maxQuantity}</strong>
                      </span>
                    </div>
                    {!item.productId && (
                      <div className="text-xs text-danger-500 font-bold mt-1 inline-flex items-center gap-1">
                        <AlertTriangle size={12} /> مش مرتبط بمنتج في المخزون
                      </div>
                    )}
                    {item.maxQuantity === 0 && (
                      <div className="text-xs text-danger-500 font-bold mt-1">
                        ⚠️ اترجع بالكامل
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-bold text-[var(--color-neutral-700)] whitespace-nowrap">
                      الكمية:
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateReturnQty(item.id, Number(e.target.value))}
                      className="w-24 border-2 border-neutral-300 p-2 rounded-lg text-center focus:border-primary-400 focus:outline-none font-bold"
                      min="0"
                      max={item.maxQuantity}
                      disabled={item.maxQuantity === 0 || !item.productId}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-2">
                سبب الإرجاع (اختياري)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all"
                placeholder="مثال: المنتج تالف"
              />
            </div>

            <div
              className={`flex justify-between items-center text-xl font-extrabold mb-4 p-4 rounded-xl border ${
                returnType === "SALE"
                  ? "bg-orange-50 border-orange-200"
                  : "bg-info-500/10 border-info-500/30"
              }`}
            >
              <span className="flex items-center gap-2 text-[var(--color-fg)]">
                <DollarSign
                  size={20}
                  className={returnType === "SALE" ? "text-orange-600" : "text-info-500"}
                />
                إجمالي المبلغ المرتجع:
              </span>
              <span className={returnType === "SALE" ? "text-orange-600" : "text-info-500"}>
                {totalRefund.toFixed(2)} ج.م
              </span>
            </div>

            <button
              onClick={handleReturn}
              disabled={totalRefund === 0}
              className={`w-full text-white font-bold py-3.5 rounded-xl active:scale-[0.97] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${
                returnType === "SALE"
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-info-500 hover:opacity-90"
              }`}
            >
              <CheckCircle size={20} /> تأكيد الإرجاع
            </button>
          </div>
        )}
      </main>
    </>
  );
}