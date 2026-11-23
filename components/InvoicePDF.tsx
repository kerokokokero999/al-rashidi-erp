"use client";

import { useRef } from "react";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { showSuccess, showError } from "@/utils/alerts";

type InvoiceItem = {
  id: string;
  name: string;
  sellPrice: number;
  quantity: number;
  unitName?: string;
};

type Invoice = {
  id: string;
  items: InvoiceItem[];
  subTotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  customerName?: string;
  createdAt?: string;
};

type Settings = {
  storeName: string;
  taxNumber: string;
  phone: string;
  phone2?: string | null;
  address: string;
  currency?: string;
  logo?: string | null;
  footerText?: string | null;
};

export default function InvoicePDF({
  invoice,
  settings,
}: {
  invoice: Invoice;
  settings: Settings | null;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!contentRef.current) return;

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a5",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${invoice.id}.pdf`);

      showSuccess("تم تحميل PDF بنجاح");
    } catch {
      showError("حدث خطأ أثناء إنشاء PDF");
    }
  };

  const storeName = settings?.storeName || "Salesaty";
  const currency = settings?.currency || "ج.م";
  const taxNumber = settings?.taxNumber || "—";
  const phone = settings?.phone || "";
  const phone2 = settings?.phone2 || "";
  const address = settings?.address || "";
  const logo = settings?.logo || null;
  const footerText = settings?.footerText || "شكراً لزيارتكم!";
  const paymentLabel = invoice.paymentMethod === "CARD" ? "فيزا / بطاقة" : "نقدي";

  return (
    <div>
      <button
        onClick={handleDownload}
        className="p-2 bg-success-100 text-success-600 rounded-lg hover:bg-success-200 transition-colors"
        title="تحميل PDF"
      >
        <Download size={18} />
      </button>

      {/* Hidden content for PDF generation */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div
          ref={contentRef}
          style={{
            width: "148mm",
            padding: "10mm",
            backgroundColor: "#ffffff",
            fontFamily: "Arial, sans-serif",
            direction: "rtl",
            color: "#1A1618",
          }}
        >
          {/* Header */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "6mm",
              borderBottom: "2px solid #FA699E",
              paddingBottom: "4mm",
            }}
          >
            {logo && (
              <img
                src={logo}
                alt="logo"
                style={{ height: "20mm", marginBottom: "2mm", objectFit: "contain" }}
                crossOrigin="anonymous"
              />
            )}
            <h1
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#FA699E",
                margin: "0 0 2mm 0",
              }}
            >
              {storeName}
            </h1>
            {address && (
              <p style={{ fontSize: "11px", color: "#7C7077", margin: "1mm 0" }}>{address}</p>
            )}
            {phone && (
              <p style={{ fontSize: "11px", color: "#7C7077", margin: "1mm 0" }}>📞 {phone}</p>
            )}
            {phone2 && (
              <p style={{ fontSize: "11px", color: "#7C7077", margin: "1mm 0" }}>📞 {phone2}</p>
            )}
            {taxNumber && taxNumber !== "—" && (
              <p style={{ fontSize: "11px", color: "#7C7077", margin: "1mm 0" }}>
                الرقم الضريبي: {taxNumber}
              </p>
            )}
            <p style={{ fontSize: "10px", color: "#A89DA3", marginTop: "2mm" }}>
              {invoice.createdAt || new Date().toLocaleString("ar-EG")}
            </p>
            <p
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                color: "#403A3D",
                marginTop: "2mm",
              }}
            >
              فاتورة رقم #{invoice.id}
            </p>
            {invoice.customerName && invoice.customerName !== "عميل نقدي" && (
              <p style={{ fontSize: "11px", color: "#5C5257", marginTop: "1mm" }}>
                العميل: {invoice.customerName}
              </p>
            )}
          </div>

          {/* Items Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4mm" }}>
            <thead>
              <tr style={{ backgroundColor: "#FAF8F9", borderBottom: "2px solid #E8E2E5" }}>
                <th
                  style={{
                    padding: "2mm",
                    textAlign: "right",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                >
                  الصنف
                </th>
                <th
                  style={{
                    padding: "2mm",
                    textAlign: "center",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                >
                  الكمية
                </th>
                <th
                  style={{
                    padding: "2mm",
                    textAlign: "left",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                >
                  السعر
                </th>
                <th
                  style={{
                    padding: "2mm",
                    textAlign: "left",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                >
                  الإجمالي
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #E8E2E5" }}>
                  <td style={{ padding: "2mm", fontSize: "11px" }}>
                    {item.name}
                    {item.unitName && (
                      <span
                        style={{
                          fontSize: "9px",
                          color: "#A89DA3",
                          display: "block",
                        }}
                      >
                        {item.unitName}
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "2mm",
                      textAlign: "center",
                      fontSize: "11px",
                    }}
                  >
                    {item.quantity}
                  </td>
                  <td
                    style={{
                      padding: "2mm",
                      textAlign: "left",
                      fontSize: "11px",
                    }}
                  >
                    {item.sellPrice.toLocaleString("ar-EG")}
                  </td>
                  <td
                    style={{
                      padding: "2mm",
                      textAlign: "left",
                      fontSize: "11px",
                      fontWeight: "bold",
                    }}
                  >
                    {(item.sellPrice * item.quantity).toLocaleString("ar-EG")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div
            style={{
              borderTop: "2px solid #E8E2E5",
              paddingTop: "3mm",
              marginBottom: "4mm",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "11px",
                marginBottom: "1mm",
                color: "#5C5257",
              }}
            >
              <span>الإجمالي الفرعي:</span>
              <span>
                {invoice.subTotal.toFixed(2)} {currency}
              </span>
            </div>
            {invoice.discount > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  marginBottom: "1mm",
                  color: "#DC2626",
                }}
              >
                <span>الخصم:</span>
                <span>
                  -{invoice.discount.toFixed(2)} {currency}
                </span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "11px",
                marginBottom: "1mm",
                color: "#5C5257",
              }}
            >
              <span>الضريبة:</span>
              <span>
                {invoice.tax.toFixed(2)} {currency}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "14px",
                fontWeight: "bold",
                color: "#FA699E",
                paddingTop: "2mm",
                borderTop: "1px solid #E8E2E5",
              }}
            >
              <span>الإجمالي النهائي:</span>
              <span>
                {invoice.total.toFixed(2)} {currency}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div
            style={{
              textAlign: "center",
              fontSize: "11px",
              color: "#5C5257",
              marginBottom: "3mm",
            }}
          >
            طريقة الدفع: <strong>{paymentLabel}</strong>
          </div>

          {/* Footer */}
          <div
            style={{
              textAlign: "center",
              fontSize: "10px",
              color: "#7C7077",
              borderTop: "1px solid #E8E2E5",
              paddingTop: "3mm",
              fontWeight: "bold",
            }}
          >
            {footerText}
          </div>
        </div>
      </div>
    </div>
  );
}