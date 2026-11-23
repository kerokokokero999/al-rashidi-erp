"use client";

import { useEffect, useState } from "react";
import { Printer, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

type InvoiceItem = {
  id: number;
  name: string;
  sellPrice: number;
  quantity: number;
  unitName?: string;
};

type InvoiceData = {
  id: number;
  items: InvoiceItem[];
  subTotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  customerName?: string;
};

type Settings = {
  storeName: string;
  taxNumber: string;
  phone: string;
  phone2?: string | null;
  address: string;
  whatsapp: string;
  currency?: string;
  logo?: string | null;
  footerText?: string | null;
};

export default function PrintPage() {
  const [invoice] = useState<InvoiceData | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem("lastInvoice");
      return saved ? (JSON.parse(saved) as InvoiceData) : null;
    } catch {
      return null;
    }
  });

  const [settings, setSettings] = useState<Settings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setSettings(data);
      })
      .catch(() => {})
      .finally(() => setLoadingSettings(false));
  }, []);

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-6">
        <div className="bg-[var(--color-card-bg)] p-8 rounded-2xl shadow-sm border border-[var(--color-card-border)] text-center max-w-sm w-full animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-neutral-100)] mb-4">
            <Printer className="text-[var(--color-neutral-400)]" size={32} />
          </div>
          <h1 className="text-xl font-extrabold text-[var(--color-fg)] mb-2">
            لا توجد فاتورة للطباعة
          </h1>
          <p className="text-sm text-[var(--color-neutral-500)] mb-6">
            قم بإتمام عملية بيع أولاً من صفحة الكاشير.
          </p>
          <Link
            href="/pos"
            className="inline-flex items-center gap-2 bg-primary-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary-600 active:scale-[0.97] transition-all"
          >
            <ArrowRight size={18} /> العودة للكاشير
          </Link>
        </div>
      </div>
    );
  }

  const storeName = settings?.storeName || "Salesaty";
  const taxNumber = settings?.taxNumber || "—";
  const phone = settings?.phone || "";
  const phone2 = settings?.phone2 || "";
  const address = settings?.address || "";
  const currency = settings?.currency || "ج.م";
  const logo = settings?.logo || null;
  const footerText = settings?.footerText || "شكراً لزيارتكم!";

  // QR Code: يحتوي على بيانات الفاتورة
  const qrData = JSON.stringify({
    sellerName: storeName,
    vatNumber: taxNumber,
    invoiceId: invoice.id,
    invoiceDate: new Date().toISOString(),
    total: invoice.total.toFixed(2),
    tax: invoice.tax.toFixed(2),
  });

  const paymentLabel = invoice.paymentMethod === "CARD" ? "فيزا / بطاقة" : "نقدي";

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print-area {
            width: 80mm;
            padding: 5mm;
            margin: 0;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-[var(--color-neutral-100)] p-4 sm:p-8 flex flex-col items-center">
        <div className="mb-6 flex gap-3 print:hidden">
          <button
            onClick={() => window.print()}
            className="bg-primary-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-600 active:scale-[0.97] transition-all shadow-sm shadow-primary-200"
          >
            <Printer size={20} /> طباعة
          </button>
          <Link
            href="/pos"
            className="bg-[var(--color-card-bg)] text-[var(--color-neutral-700)] px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[var(--color-bg)] active:scale-[0.97] transition-all shadow-sm border border-[var(--color-neutral-200)]"
          >
            <ArrowRight size={20} /> رجوع
          </Link>
        </div>

        {loadingSettings && (
          <div className="mb-4 flex items-center gap-2 text-sm text-[var(--color-neutral-500)] print:hidden">
            <Loader2 size={16} className="animate-spin" />
            جاري تحميل بيانات المتجر...
          </div>
        )}

        <div className="bg-[var(--color-card-bg)] p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-sm text-right print-area">
          {/* Header */}
          <div className="text-center mb-6 border-b border-[var(--color-neutral-200)] pb-4">
            {logo && (
              <img
                src={logo}
                alt="logo"
                className="mx-auto mb-2 h-16 object-contain"
              />
            )}
            <h1 className="text-2xl font-extrabold text-primary-600 mb-1">
              {storeName}
            </h1>
            {address && (
              <p className="text-[var(--color-neutral-500)] text-xs leading-relaxed">{address}</p>
            )}
            {phone && (
              <p className="text-[var(--color-neutral-500)] text-xs mt-1" dir="ltr">
                📞 {phone}
              </p>
            )}
            {phone2 && (
              <p className="text-[var(--color-neutral-500)] text-xs mt-1" dir="ltr">
                📞 {phone2}
              </p>
            )}
            {taxNumber && taxNumber !== "—" && (
              <p className="text-[var(--color-neutral-500)] text-xs mt-1">
                الرقم الضريبي: {taxNumber}
              </p>
            )}
            <p className="text-[var(--color-neutral-400)] text-xs mt-2">
              {new Date().toLocaleString("ar-EG")}
            </p>
            {invoice.customerName && invoice.customerName !== "عميل نقدي" && (
              <p className="text-[var(--color-neutral-600)] text-xs mt-1 font-bold">
                العميل: {invoice.customerName}
              </p>
            )}
          </div>

          {/* Items table */}
          <table className="w-full mb-4 text-sm">
            <thead>
              <tr className="border-b-2 border-neutral-300">
                <th className="pb-2 text-right font-bold text-[var(--color-neutral-700)]">الصنف</th>
                <th className="pb-2 text-center font-bold text-[var(--color-neutral-700)]">الكمية</th>
                <th className="pb-2 text-left font-bold text-[var(--color-neutral-700)]">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="border-b border-[var(--color-card-border)]">
                  <td className="py-2 text-right">
                    <div className="text-[var(--color-fg)]">{item.name}</div>
                    {item.unitName && (
                      <div className="text-xs text-[var(--color-neutral-400)]">{item.unitName}</div>
                    )}
                  </td>
                  <td className="py-2 text-center text-[var(--color-neutral-700)]">{item.quantity}</td>
                  <td className="py-2 text-left text-[var(--color-fg)] font-bold">
                    {(item.sellPrice * item.quantity).toLocaleString("ar-EG")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="space-y-1 text-sm border-t border-[var(--color-neutral-200)] pt-2">
            <div className="flex justify-between text-[var(--color-neutral-600)]">
              <span>الإجمالي الفرعي:</span>
              <span>{(invoice.subTotal || 0).toFixed(2)} {currency}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-danger-600">
                <span>الخصم:</span>
                <span>-{(invoice.discount || 0).toFixed(2)} {currency}</span>
              </div>
            )}
            <div className="flex justify-between text-[var(--color-neutral-600)]">
              <span>الضريبة:</span>
              <span>{(invoice.tax || 0).toFixed(2)} {currency}</span>
            </div>
            <div className="flex justify-between text-lg font-extrabold text-primary-600 pt-2 border-t border-[var(--color-neutral-200)] mt-2">
              <span>الإجمالي النهائي:</span>
              <span>{invoice.total.toFixed(2)} {currency}</span>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-[var(--color-neutral-500)]">
            طريقة الدفع: <span className="font-bold text-[var(--color-neutral-700)]">{paymentLabel}</span>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mt-6">
            <QRCodeSVG value={qrData} size={120} />
          </div>

          {/* Footer */}
          <div className="text-center mt-4">
            <p className="text-xs text-[var(--color-neutral-500)] font-bold">{footerText}</p>
          </div>
        </div>
      </div>
    </>
  );
}