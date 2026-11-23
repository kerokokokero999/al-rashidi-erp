"use client";

import { useState, useEffect } from "react";
import Header from "../../../components/Header";
import Link from "next/link";
import { ArrowRight, Printer, Check, AlertCircle, Save, RefreshCw } from "lucide-react";
import { showSuccess, showError } from "@/utils/alerts";

type PrinterInfo = {
  name: string;
  isDefault: boolean;
};

const mockPrinters: PrinterInfo[] = [
  { name: "Microsoft Print to PDF", isDefault: true },
  { name: "Foxit Reader PDF Printer", isDefault: false },
  { name: "Canon MG2500 series Printer", isDefault: false },
  { name: "EPSON L3150 Series", isDefault: false },
];

export default function PrintersPage() {
  const [printers] = useState<PrinterInfo[]>(mockPrinters);
  const [selectedPrinter, setSelectedPrinter] = useState<string>(() => {
    if (typeof window === "undefined") return mockPrinters[0].name;
    return localStorage.getItem("selectedPrinter") || mockPrinters[0].name;
  });
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    try {
      localStorage.setItem("selectedPrinter", selectedPrinter);
      showSuccess(`تم حفظ الطابعة: ${selectedPrinter}`);
    } catch {
      showError("حدث خطأ في الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const testPrint = () => {
    const testContent = `
      <html>
        <head><title>Test Print</title></head>
        <body style="font-family: Arial; padding: 20px; text-align: center;">
          <h1>Salesaty</h1>
          <h2>اختبار الطباعة</h2>
          <p>هذه صفحة اختبار للتأكد من إعدادات الطابعة.</p>
          <p>التاريخ: ${new Date().toLocaleString("ar-EG")}</p>
          <p>الطابعة: ${selectedPrinter}</p>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(testContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-6 animate-slide-down">
          <Link
            href="/settings"
            className="text-[var(--color-neutral-500)] hover:text-primary-600 hover:bg-primary-50 transition-colors p-2 rounded-lg"
          >
            <ArrowRight size={22} />
          </Link>
          <div className="p-3 rounded-xl bg-primary-100">
            <Printer className="text-primary-600" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">إعدادات الطابعات</h1>
            <p className="text-sm text-[var(--color-neutral-500)] mt-1">اختر الطابعة الافتراضية للبرنامج</p>
          </div>
        </div>

        <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] animate-slide-up">
          <div className="mb-6">
            <h2 className="text-lg font-extrabold text-[var(--color-fg)] mb-4 flex items-center gap-2">
              <Printer className="text-primary-500" size={20} /> الطابعات المتاحة
            </h2>

            <div className="space-y-2">
              {printers.map((printer) => (
                <label
                  key={printer.name}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedPrinter === printer.name
                      ? "border-primary-400 bg-primary-50"
                      : "border-[var(--color-neutral-200)] hover:border-neutral-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="printer"
                    value={printer.name}
                    checked={selectedPrinter === printer.name}
                    onChange={(e) => setSelectedPrinter(e.target.value)}
                    className="w-5 h-5 accent-primary-500"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-[var(--color-fg)]">{printer.name}</div>
                    {printer.isDefault && (
                      <div className="text-xs text-[var(--color-neutral-500)] mt-0.5">الطابعة الافتراضية للنظام</div>
                    )}
                  </div>
                  {selectedPrinter === printer.name && (
                    <Check className="text-primary-600" size={20} />
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="bg-info-500/10 p-4 rounded-xl mb-6 flex items-start gap-2">
            <AlertCircle className="text-info-500 flex-shrink-0 mt-0.5" size={18} />
            <div className="text-sm text-info-600">
              <p className="font-bold mb-1">ملاحظة</p>
              <p className="text-xs">
                الطابعات المعروضة هي الطابعات المثبتة على جهازك. عند الطباعة، سيظهر لك مربع حوار اختيار الطابعة. هذه الإعدادات تستخدم لتحديد الطابعة المفضلة.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 active:scale-[0.97] transition-all flex items-center justify-center gap-2 shadow-sm shadow-primary-200"
            >
              <Save size={18} /> {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </button>
            <button
              onClick={testPrint}
              className="bg-info-500 text-white font-bold py-3 px-6 rounded-xl hover:opacity-90 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} /> اختبار الطباعة
            </button>
          </div>
        </div>
      </main>
    </>
  );
}