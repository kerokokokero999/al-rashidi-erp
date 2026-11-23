"use client";

import { useState } from "react";
import { Eye, Copy, Check, X, Package, User, DollarSign } from "lucide-react";

type InvoiceItem = {
  id: string;
  name: string;
  quantity: number;
  sellPrice: number;
};

type Invoice = {
  id: string;
  items: InvoiceItem[];
  total: number;
  subTotal?: number;
  discount?: number;
  tax?: number;
  paymentMethod?: string;
  customerName?: string;
  createdAt: string;
};

export default function InvoiceDetailsModal({ invoice }: { invoice: Invoice }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(invoice.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const paymentLabel = invoice.paymentMethod === "CARD" ? "فيزا / بطاقة" : "نقدي";

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 bg-info-500/10 text-info-500 rounded-lg hover:bg-info-500/20 transition-colors"
        title="عرض التفاصيل"
      >
        <Eye size={18} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in">
            {/* Header */}
            <div className="p-5 border-b border-[var(--color-card-border)] flex justify-between items-center sticky top-0 bg-[var(--color-card-bg)] z-10">
              <h2 className="text-lg font-extrabold text-[var(--color-fg)]">تفاصيل الفاتورة</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg text-[var(--color-neutral-400)] hover:text-danger-600 hover:bg-danger-50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Invoice ID */}
              <div className="bg-[var(--color-bg)] p-3 rounded-xl flex items-center justify-between border border-[var(--color-card-border)]">
                <div>
                  <span className="text-xs text-[var(--color-neutral-500)] block mb-0.5">رقم الفاتورة</span>
                  <span className="font-mono text-sm font-bold text-[var(--color-fg)]">#{invoice.id}</span>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="p-2 bg-[var(--color-card-bg)] rounded-lg border border-[var(--color-neutral-200)] hover:bg-[var(--color-neutral-100)] transition-colors"
                  title="نسخ رقم الفاتورة"
                >
                  {copied ? (
                    <Check size={18} className="text-success-600" />
                  ) : (
                    <Copy size={18} className="text-[var(--color-neutral-600)]" />
                  )}
                </button>
              </div>

              {/* Customer + Payment */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--color-bg)] p-3 rounded-xl border border-[var(--color-card-border)]">
                  <span className="text-xs text-[var(--color-neutral-500)] block mb-0.5 flex items-center gap-1">
                    <User size={12} /> العميل
                  </span>
                  <span className="font-bold text-sm text-[var(--color-fg)]">
                    {invoice.customerName || "عميل نقدي"}
                  </span>
                </div>
                <div className="bg-[var(--color-bg)] p-3 rounded-xl border border-[var(--color-card-border)]">
                  <span className="text-xs text-[var(--color-neutral-500)] block mb-0.5 flex items-center gap-1">
                    <DollarSign size={12} /> طريقة الدفع
                  </span>
                  <span className="font-bold text-sm text-[var(--color-fg)]">{paymentLabel}</span>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-sm font-bold text-[var(--color-neutral-700)] mb-2 flex items-center gap-1.5">
                  <Package size={14} /> الأصناف ({invoice.items.length})
                </h3>
                <div className="space-y-2">
                  {invoice.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-[var(--color-bg)] p-3 rounded-xl border border-[var(--color-card-border)]"
                    >
                      <div>
                        <div className="font-bold text-sm text-[var(--color-fg)]">{item.name}</div>
                        <div className="text-xs text-[var(--color-neutral-500)] mt-0.5">
                          {item.quantity} × {item.sellPrice.toLocaleString("ar-EG")} ج.م
                        </div>
                      </div>
                      <div className="font-bold text-primary-600 text-sm">
                        {(item.quantity * item.sellPrice).toLocaleString("ar-EG")} ج.م
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-[var(--color-card-border)] pt-4 space-y-2">
                {invoice.subTotal !== undefined && (
                  <div className="flex justify-between text-sm text-[var(--color-neutral-600)]">
                    <span>الإجمالي الفرعي:</span>
                    <span>{invoice.subTotal.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                )}
                {invoice.discount !== undefined && invoice.discount > 0 && (
                  <div className="flex justify-between text-sm text-danger-600">
                    <span>الخصم:</span>
                    <span>- {invoice.discount.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                )}
                {invoice.tax !== undefined && invoice.tax > 0 && (
                  <div className="flex justify-between text-sm text-[var(--color-neutral-600)]">
                    <span>الضريبة:</span>
                    <span>{invoice.tax.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-extrabold text-success-600 pt-2 border-t border-[var(--color-card-border)]">
                  <span>الإجمالي:</span>
                  <span>{invoice.total.toLocaleString("ar-EG")} ج.م</span>
                </div>
                <div className="text-xs text-[var(--color-neutral-400)] text-center pt-2">
                  {invoice.createdAt}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}