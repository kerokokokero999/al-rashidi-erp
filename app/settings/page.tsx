"use client";

import { useState, useEffect } from "react";
import Header from "../../components/Header";
import {
  Settings as SettingsIcon,
  Save,
  Store,
  Percent,
  Printer,
  Barcode,
  RefreshCw,
  Phone,
  MapPin,
  MessageCircle,
  FileText,
  DollarSign,
  Image as ImageIcon,
  AlignRight,
  Upload,
  X,
} from "lucide-react";
import { showSuccess, showError, showConfirm } from "@/utils/alerts";
import Link from "next/link";

type Settings = {
  storeName: string;
  phone: string;
  phone2?: string | null;
  whatsapp: string;
  address: string;
  taxNumber: string;
  currency: string;
  defaultTaxRate: number;
  defaultDiscount: number;
  autoPrintInvoice: boolean;
  enableBarcode: boolean;
  invoicePrefix: string;
  logo?: string | null;
  footerText?: string | null;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch(() => showError("حدث خطأ في جلب الإعدادات"))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!settings) return;
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setSettings({ ...settings, [name]: checked });
    } else {
      setSettings({ ...settings, [name]: value });
    }
  };

  // ✅ رفع اللوجو من الجهاز
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (res.ok && json.url) {
        setSettings({ ...settings, logo: json.url });
        showSuccess("تم رفع اللوجو بنجاح");
      } else {
        showError("حدث خطأ أثناء رفع الصورة");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    } finally {
      setUploadingLogo(false);
      // تصفير الـ input عشان لو عايز يرفع نفس الملف تاني
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        showSuccess("تم حفظ الإعدادات بنجاح");
      } else {
        showError("حدث خطأ أثناء الحفظ");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    const confirmed = await showConfirm(
      "مزامنة المنتجات",
      "هل أنت متأكد من رفع المنتجات والكميات إلى الموقع الإلكتروني؟"
    );
    if (!confirmed) return;

    setSyncing(true);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "products" }),
      });
      if (res.ok) {
        showSuccess("تمت مزامنة المنتجات بنجاح!");
      } else {
        showError("حدث خطأ أثناء المزامنة");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    } finally {
      setSyncing(false);
    }
  };

  if (loading || !settings)
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-pulse-soft">
          <SettingsIcon className="text-primary-500 mx-auto mb-4" size={48} />
          <p className="text-[var(--color-neutral-500)] font-bold">جاري التحميل...</p>
        </div>
      </div>
    );

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 animate-slide-down">
          <div className="p-3 rounded-xl bg-primary-100">
            <SettingsIcon className="text-primary-600" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">إعدادات النظام</h1>
            <p className="text-sm text-[var(--color-neutral-500)] mt-1">إدارة بيانات المتجر والفواتير</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* بيانات المتجر */}
          <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] animate-slide-up">
            <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2 text-[var(--color-fg)]">
              <Store className="text-primary-500" size={22} /> بيانات المتجر
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">اسم المتجر</label>
                <input
                  type="text"
                  name="storeName"
                  value={settings.storeName}
                  onChange={handleChange}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5 flex items-center gap-1.5">
                  <Phone size={14} className="text-[var(--color-neutral-400)]" /> رقم التليفون
                </label>
                <input
                  type="text"
                  name="phone"
                  value={settings.phone}
                  onChange={handleChange}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5 flex items-center gap-1.5">
                  <Phone size={14} className="text-[var(--color-neutral-400)]" /> رقم تليفون إضافي
                </label>
                <input
                  type="text"
                  name="phone2"
                  value={settings.phone2 || ""}
                  onChange={handleChange}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                  dir="ltr"
                  placeholder="اختياري"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5 flex items-center gap-1.5">
                  <MessageCircle size={14} className="text-[var(--color-neutral-400)]" /> رقم الواتساب (للدليفري)
                </label>
                <input
                  type="text"
                  name="whatsapp"
                  value={settings.whatsapp}
                  onChange={handleChange}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                  placeholder="201000000000"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5 flex items-center gap-1.5">
                  <FileText size={14} className="text-[var(--color-neutral-400)]" /> الرقم الضريبي
                </label>
                <input
                  type="text"
                  name="taxNumber"
                  value={settings.taxNumber}
                  onChange={handleChange}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5 flex items-center gap-1.5">
                  <DollarSign size={14} className="text-[var(--color-neutral-400)]" /> العملة
                </label>
                <input
                  type="text"
                  name="currency"
                  value={settings.currency}
                  onChange={handleChange}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5 flex items-center gap-1.5">
                  <MapPin size={14} className="text-[var(--color-neutral-400)]" /> العنوان
                </label>
                <input
                  type="text"
                  name="address"
                  value={settings.address}
                  onChange={handleChange}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* بيانات الفاتورة */}
          <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] animate-slide-up">
            <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2 text-[var(--color-fg)]">
              <ImageIcon className="text-primary-500" size={22} /> بيانات الفاتورة المطبوعة
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {/* ✅ اللوجو مع رفع صورة */}
              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">
                  لوجو الفاتورة (اختياري)
                </label>

                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    name="logo"
                    value={settings.logo || ""}
                    onChange={handleChange}
                    placeholder="/logo.png أو ارفع صورة من الجهاز..."
                    className="flex-1 min-w-[200px] border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                    dir="ltr"
                  />

                  {/* زرار رفع صورة */}
                  <label className="bg-primary-100 text-primary-700 px-4 py-3 rounded-xl cursor-pointer hover:bg-primary-200 active:scale-[0.97] transition flex items-center gap-2 font-bold text-sm whitespace-nowrap">
                    <Upload size={18} />
                    {uploadingLogo ? "جاري الرفع..." : "رفع صورة"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={uploadingLogo}
                    />
                  </label>
                </div>

                {uploadingLogo && (
                  <p className="text-sm text-info-500 mt-2 flex items-center gap-1.5">
                    <RefreshCw size={14} className="animate-spin" />
                    جاري رفع الصورة...
                  </p>
                )}

                {/* معاينة اللوجو */}
                {settings.logo && (
                  <div className="mt-3 relative inline-block">
                    <div className="p-3 bg-[var(--color-bg)] rounded-xl border-2 border-[var(--color-card-border)]">
                      <img
                        src={settings.logo}
                        alt="logo"
                        className="h-20 object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, logo: "" })}
                      className="absolute -top-2 -right-2 bg-danger-500 text-white rounded-full p-1.5 hover:bg-danger-600 active:scale-95 transition"
                      title="حذف اللوجو"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5 flex items-center gap-1.5">
                  <AlignRight size={14} className="text-[var(--color-neutral-400)]" /> نص أسفل الفاتورة
                </label>
                <textarea
                  name="footerText"
                  value={settings.footerText || ""}
                  onChange={handleChange}
                  placeholder="مثال: شكراً لزيارتكم! الأسعار تشمل ضريبة القيمة المضافة."
                  rows={3}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* إعدادات الكاشير */}
          <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] animate-slide-up">
            <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2 text-[var(--color-fg)]">
              <Percent className="text-primary-500" size={22} /> إعدادات الكاشير والضرائب
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">نسبة الضريبة الافتراضية (%)</label>
                <input
                  type="number"
                  name="defaultTaxRate"
                  value={settings.defaultTaxRate}
                  onChange={handleChange}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">الخصم الافتراضي</label>
                <input
                  type="number"
                  name="defaultDiscount"
                  value={settings.defaultDiscount}
                  onChange={handleChange}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 mt-4 bg-[var(--color-bg)] p-3 rounded-xl">
                <input
                  type="checkbox"
                  name="autoPrintInvoice"
                  checked={settings.autoPrintInvoice}
                  onChange={handleChange}
                  id="autoPrint"
                  className="w-5 h-5 accent-primary-500"
                />
                <label htmlFor="autoPrint" className="text-sm font-bold cursor-pointer flex items-center gap-2 text-[var(--color-neutral-700)]">
                  <Printer size={16} /> طباعة الفاتورة تلقائياً
                </label>
              </div>
              <div className="flex items-center gap-2 mt-4 bg-[var(--color-bg)] p-3 rounded-xl">
                <input
                  type="checkbox"
                  name="enableBarcode"
                  checked={settings.enableBarcode}
                  onChange={handleChange}
                  id="barcode"
                  className="w-5 h-5 accent-primary-500"
                />
                <label htmlFor="barcode" className="text-sm font-bold cursor-pointer flex items-center gap-2 text-[var(--color-neutral-700)]">
                  <Barcode size={16} /> تفعيل البحث بالباركود
                </label>
              </div>
            </div>
          </div>

          {/* إعدادات الفواتير */}
          <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] animate-slide-up">
            <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2 text-[var(--color-fg)]">
              <Printer className="text-primary-500" size={22} /> إعدادات الفواتير والطابعات
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">بادئة رقم الفاتورة</label>
                <input
                  type="text"
                  name="invoicePrefix"
                  value={settings.invoicePrefix}
                  onChange={handleChange}
                  placeholder="INV-"
                  className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">إعدادات الطابعة</label>
                <Link
                  href="/settings/printers"
                  className="inline-flex items-center gap-2 bg-info-500 text-white px-4 py-3 rounded-xl font-bold hover:opacity-90 active:scale-[0.97] transition-all shadow-sm text-sm w-full justify-center"
                >
                  <Printer size={16} /> فتح إعدادات الطابعات
                </Link>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || uploadingLogo}
            className="w-full bg-primary-500 text-white font-bold py-4 rounded-xl hover:bg-primary-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-lg shadow-sm shadow-primary-200"
          >
            <Save size={20} /> {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </button>
        </form>

        {/* مزامنة المنتجات */}
        <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] mt-6 animate-slide-up">
          <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2 text-[var(--color-fg)]">
            <RefreshCw className="text-info-500" size={22} /> مزامنة المنتجات مع الموقع
          </h2>
          <p className="text-[var(--color-neutral-500)] mb-4 text-sm">
            هيتم رفع المنتجات والكميات إلى الموقع الإلكتروني (Vercel) لتظهر للزوار.
          </p>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="bg-info-500 text-white font-bold py-3 px-6 rounded-xl hover:opacity-90 active:scale-[0.97] transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={18} className={syncing ? "animate-spin" : ""} />
            {syncing ? "جاري المزامنة..." : "مزامنة الآن"}
          </button>
        </div>
      </main>
    </>
  );
}