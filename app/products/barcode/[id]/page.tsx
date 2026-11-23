"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Header from "../../../../components/Header";
import Link from "next/link";
import {
  ArrowRight,
  Printer,
  Package,
  Download,
  Copy,
  Check,
  QrCode,
  Barcode as BarcodeIcon,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Barcode from "react-barcode";
import { showSuccess, showError } from "@/utils/alerts";

type Product = {
  id: number;
  name: string;
  barcode: string | null;
  sellPrice: number;
  image: string | null;
  category?: { name: string } | null;
  unit?: { name: string } | null;
};

export default function ProductBarcodePage() {
  const params = useParams();
  const productId = Number(params.id);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiesCount, setCopiesCount] = useState(1);
  const [showPrice, setShowPrice] = useState(true);
  const [showName, setShowName] = useState(true);
  const [showStoreName, setShowStoreName] = useState(true);

  // ✅ نوع الكود
  const [codeType, setCodeType] = useState<"barcode" | "qr">("barcode");
  const [barcodeFormat, setBarcodeFormat] = useState<"CODE128" | "EAN13" | "UPC">("CODE128");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (res.ok) setProduct(await res.json());
      } catch {
        showError("حدث خطأ في جلب المنتج");
      } finally {
        setLoading(false);
      }
    };
    if (productId) fetchProduct();
  }, [productId]);

  const barcodeValue = product?.barcode || `PROD-${productId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(barcodeValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // ✅ تحميل الكود (سواء Barcode أو QR)
  
// تحميل الكود (سواء Barcode أو QR)
const downloadCode = () => {
  const targetId = codeType === "qr" ? "product-qr" : "product-barcode";

  // تحديد عنصر SVG الصحيح
  const svg =
    codeType === "qr"
      ? document.getElementById(targetId)
      : document.querySelector(`#${targetId} svg`);

  if (!svg) {
    showError("تعذر العثور على الكود");
    return;
  }

  try {
    const svgData = new XMLSerializer().serializeToString(svg);

    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        URL.revokeObjectURL(url);
        showError("حدث خطأ في تحميل الصورة");
        return;
      }

      if (codeType === "qr") {
        canvas.width = 600;
        canvas.height = 600;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 600, 600);
        ctx.drawImage(img, 0, 0, 600, 600);
      } else {
        canvas.width = 1200;
        canvas.height = 400;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 1200, 400);

        const scale = Math.min(
          1100 / img.width,
          350 / img.height
        );

        const width = img.width * scale;
        const height = img.height * scale;

        ctx.drawImage(
          img,
          (1200 - width) / 2,
          (400 - height) / 2,
          width,
          height
        );
      }

      const pngUrl = canvas.toDataURL("image/png");

      // إنشاء رابط التحميل
      const link = document.createElement("a");

      link.download = `${codeType}-${product?.name || productId}.png`;
      link.href = pngUrl;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      showSuccess("تم تحميل الكود بنجاح");
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      showError("حدث خطأ أثناء تحويل الكود إلى صورة");
    };

    img.src = url;
  } catch (error) {
    showError("حدث خطأ في تحميل الصورة");
    console.error(error);
  }
};

  if (loading)
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-pulse-soft">
          <Package className="text-primary-500 mx-auto mb-4" size={48} />
          <p className="text-[var(--color-neutral-500)] font-bold">جاري التحميل...</p>
        </div>
      </div>
    );

  if (!product)
    return (
      <div className="text-center py-20">
        <Package className="mx-auto text-neutral-300 mb-3" size={48} />
        <p className="text-[var(--color-neutral-500)]">المنتج غير موجود.</p>
        <Link href="/products" className="text-primary-600 font-bold hover:underline mt-4 inline-block">
          ← العودة للمنتجات
        </Link>
      </div>
    );

  // ✅ التحقق من صحة EAN13 (13 رقم)
  const isValidEAN13 = /^\d{13}$/.test(barcodeValue);
  const isValidUPC = /^\d{12}$/.test(barcodeValue);

  // لو Barcode، نختار الـ format المناسب
  const effectiveFormat =
    barcodeFormat === "EAN13" && !isValidEAN13
      ? "CODE128"
      : barcodeFormat === "UPC" && !isValidUPC
      ? "CODE128"
      : barcodeFormat;

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: 60mm 40mm;
            margin: 2mm;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .print-area {
            box-shadow: none !important;
            border: none !important;
            padding: 2mm !important;
            margin: 0 !important;
            width: 56mm !important;
            page-break-after: always;
          }
        }
      `}</style>

      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 animate-slide-down no-print">
          <Link
            href="/products"
            className="text-[var(--color-neutral-500)] hover:text-primary-600 hover:bg-primary-50 transition-colors p-2 rounded-lg"
          >
            <ArrowRight size={22} />
          </Link>
          <div className="p-3 rounded-xl bg-primary-100">
            <QrCode className="text-primary-600" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">طباعة الباركود</h1>
            <p className="text-sm text-[var(--color-neutral-500)] mt-1">{product.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview */}
          <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] animate-slide-up">
            <h2 className="text-lg font-extrabold text-[var(--color-fg)] mb-4">معاينة الملصق</h2>

            {/* Code Type Toggle */}
            <div className="flex gap-2 mb-4 no-print">
              <button
                onClick={() => setCodeType("barcode")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  codeType === "barcode"
                    ? "bg-primary-500 text-white shadow-sm"
                    : "bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]"
                }`}
              >
                <BarcodeIcon size={16} /> Barcode (للكاشير)
              </button>
              <button
                onClick={() => setCodeType("qr")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  codeType === "qr"
                    ? "bg-primary-500 text-white shadow-sm"
                    : "bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]"
                }`}
              >
                <QrCode size={16} /> QR Code (للموبايل)
              </button>
            </div>

            {/* Format Selector (Barcode only) */}
            {codeType === "barcode" && (
              <div className="mb-4 no-print">
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">
                  نوع الباركود
                </label>
                <select
                  value={barcodeFormat}
                  onChange={(e) => setBarcodeFormat(e.target.value as "CODE128" | "EAN13" | "UPC")}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-2.5 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
                >
                  <option value="CODE128">CODE128 (يقبل أي نص/أرقام)</option>
                  <option value="EAN13" disabled={!isValidEAN13}>
                    EAN13 (13 رقم فقط) {!isValidEAN13 && "- الباركود مش 13 رقم"}
                  </option>
                  <option value="UPC" disabled={!isValidUPC}>
                    UPC (12 رقم فقط) {!isValidUPC && "- الباركود مش 12 رقم"}
                  </option>
                </select>
              </div>
            )}

            {/* Preview Area */}
            <div className="flex justify-center mb-4 p-4 bg-[var(--color-bg)] rounded-xl overflow-x-auto">
              <div
                className="bg-white p-4 rounded-xl border-2 border-[var(--color-neutral-200)] print-area"
                style={{ width: "fit-content", minWidth: "220px" }}
              >
                {showStoreName && (
                  <div className="text-center text-xs font-bold text-black mb-1">Salesaty</div>
                )}
                {showName && (
                  <div className="text-center text-[10px] text-gray-700 mb-1 truncate max-w-[200px]">
                    {product.name}
                  </div>
                )}

                <div className="flex justify-center my-1">
                  {codeType === "qr" ? (
                    <QRCodeSVG
                      id="product-qr"
                      value={barcodeValue}
                      size={80}
                      level="M"
                    />
                  ) : (
                    <div id="product-barcode" className="flex justify-center">
                      <Barcode
                        value={barcodeValue}
                        format={effectiveFormat}
                        width={1.5}
                        height={50}
                        displayValue={true}
                        fontSize={10}
                        margin={0}
                        background="#ffffff"
                        lineColor="#000000"
                      />
                    </div>
                  )}
                </div>

                {showPrice && (
                  <div className="text-center text-sm font-extrabold text-primary-600">
                    {product.sellPrice.toLocaleString("ar-EG")} ج.م
                  </div>
                )}

                {codeType === "qr" && (
                  <div className="text-center text-[8px] text-gray-500 mt-1 font-mono">
                    {barcodeValue}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-3 gap-2 no-print">
              <button
                onClick={downloadCode}
                className="bg-info-500 text-white p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 hover:opacity-90 active:scale-[0.97] transition-all"
              >
                <Download size={14} /> تحميل
              </button>
              <button
                onClick={copyToClipboard}
                className="bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)] p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 hover:bg-neutral-200 active:scale-[0.97] transition-all"
              >
                {copied ? <Check size={14} className="text-success-600" /> : <Copy size={14} />}
                {copied ? "تم" : "نسخ"}
              </button>
              <button
                onClick={handlePrint}
                className="bg-primary-500 text-white p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 hover:bg-primary-600 active:scale-[0.97] transition-all"
              >
                <Printer size={14} /> طباعة
              </button>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] animate-slide-up no-print">
            <h2 className="text-lg font-extrabold text-[var(--color-fg)] mb-4">إعدادات الملصق</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">عدد النسخ</label>
                <input
                  type="number"
                  value={copiesCount}
                  onChange={(e) => setCopiesCount(Math.max(1, Number(e.target.value)))}
                  min={1}
                  max={100}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-[var(--color-neutral-200)] cursor-pointer hover:border-primary-300 transition-all">
                  <input
                    type="checkbox"
                    checked={showStoreName}
                    onChange={(e) => setShowStoreName(e.target.checked)}
                    className="w-5 h-5 accent-primary-500"
                  />
                  <span className="text-sm font-bold text-[var(--color-neutral-700)]">إظهار اسم المتجر</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-[var(--color-neutral-200)] cursor-pointer hover:border-primary-300 transition-all">
                  <input
                    type="checkbox"
                    checked={showName}
                    onChange={(e) => setShowName(e.target.checked)}
                    className="w-5 h-5 accent-primary-500"
                  />
                  <span className="text-sm font-bold text-[var(--color-neutral-700)]">إظهار اسم المنتج</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-[var(--color-neutral-200)] cursor-pointer hover:border-primary-300 transition-all">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                    className="w-5 h-5 accent-primary-500"
                  />
                  <span className="text-sm font-bold text-[var(--color-neutral-700)]">إظهار السعر</span>
                </label>
              </div>

              <div className="bg-info-500/10 p-3 rounded-xl text-sm text-info-500">
                <p className="font-bold mb-1">💡 ملاحظة</p>
                <p className="text-xs">
                  {codeType === "barcode"
                    ? "Barcode يقراه قارئ الباركود العادي في الكاشير."
                    : "QR Code يقراه الموبايل (مش قارئ الباركود العادي)."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Print Area (hidden on screen, visible on print) */}
        <div className="hidden print:block">
          {Array.from({ length: copiesCount }).map((_, idx) => (
            <div key={idx} className="print-area">
              {showStoreName && (
                <div className="text-center text-xs font-bold text-black mb-1">Salesaty</div>
              )}
              {showName && (
                <div className="text-center text-[10px] text-gray-700 mb-1 truncate">
                  {product.name}
                </div>
              )}
              <div className="flex justify-center my-1">
                {codeType === "qr" ? (
                  <QRCodeSVG value={barcodeValue} size={80} level="M" />
                ) : (
                  <Barcode
                    value={barcodeValue}
                    format={effectiveFormat}
                    width={1.5}
                    height={50}
                    displayValue={true}
                    fontSize={10}
                    margin={0}
                    background="#ffffff"
                    lineColor="#000000"
                  />
                )}
              </div>
              {showPrice && (
                <div className="text-center text-sm font-extrabold text-primary-600">
                  {product.sellPrice.toLocaleString("ar-EG")} ج.م
                </div>
              )}
              {codeType === "qr" && (
                <div className="text-center text-[8px] text-gray-500 mt-1 font-mono">
                  {barcodeValue}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}