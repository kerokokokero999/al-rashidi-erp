"use client";

import { useState, useEffect } from "react";
import Header from "../../components/Header";
import {
  Download,
  Database,
  CheckCircle,
  Upload,
  AlertTriangle,
  Trash2,
  Settings,
  Clock,
  Calendar,
  HardDrive,
} from "lucide-react";
import { showSuccess, showError, showConfirm } from "@/utils/alerts";

type SettingsType = {
  autoBackupEnabled?: boolean;
  autoBackupFrequency?: string;
  lastBackupAt?: string | null;
};

export default function BackupPage() {
  const [loading, setLoading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [resetting, setResetting] = useState(false);

  // إعدادات النسخ التلقائي
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupFrequency, setAutoBackupFrequency] = useState("DAILY");
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [savingAutoSettings, setSavingAutoSettings] = useState(false);
  const [manualBackupSaving, setManualBackupSaving] = useState(false);

  // جلب الإعدادات
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data: SettingsType) => {
        setAutoBackupEnabled(data.autoBackupEnabled || false);
        setAutoBackupFrequency(data.autoBackupFrequency || "DAILY");
        setLastBackup(data.lastBackupAt || null);
      })
      .catch(() => {});
  }, []);

  // نسخ احتياطي يدوي (تحميل)
  const handleBackup = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error("حدث خطأ");

      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `backup-${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      showSuccess("تم تحميل النسخة الاحتياطية بنجاح!");
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 5000);
    } catch {
      showError("حدث خطأ أثناء إنشاء النسخة الاحتياطية");
    } finally {
      setLoading(false);
    }
  };

  // نسخ احتياطي محلي (بيتحفظ في فولدر backups)
  const handleManualBackup = async () => {
    setManualBackupSaving(true);
    try {
      const res = await fetch("/api/backup", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        showSuccess(`تم حفظ النسخة: ${data.fileName}`);
        // تحديث lastBackup
        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          setLastBackup(settings.lastBackupAt);
        }
      } else {
        showError("حدث خطأ أثناء الحفظ");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    } finally {
      setManualBackupSaving(false);
    }
  };

  // حفظ إعدادات النسخ التلقائي
  const saveAutoBackupSettings = async () => {
    setSavingAutoSettings(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autoBackupEnabled,
          autoBackupFrequency,
        }),
      });
      if (res.ok) {
        showSuccess("تم حفظ إعدادات النسخ التلقائي");
      } else {
        showError("حدث خطأ أثناء الحفظ");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    } finally {
      setSavingAutoSettings(false);
    }
  };

  // استعادة
  const handleRestore = async () => {
    if (!restoreFile) {
      showError("يرجى اختيار ملف النسخة الاحتياطية");
      return;
    }

    const confirmed = await showConfirm(
      "استعادة النسخة الاحتياطية",
      "سيتم مسح جميع البيانات الحالية واستبدالها ببيانات الملف. هل أنت متأكد؟"
    );
    if (!confirmed) return;

    setRestoring(true);
    const formData = new FormData();
    formData.append("file", restoreFile);

    try {
      const res = await fetch("/api/backup/restore", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        showSuccess("تم استعادة البيانات بنجاح! سيتم تحديث الصفحة.");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showError("حدث خطأ أثناء الاستعادة");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    } finally {
      setRestoring(false);
    }
  };

  // Reset
  const handleReset = async () => {
    const firstConfirm = await showConfirm(
      "⚠️ تحذير: تهيئة قاعدة البيانات",
      "سيتم مسح جميع البيانات (منتجات، فواتير، عملاء، مشتريات، إلخ) ماعدا المستخدمين. هل أنت متأكد؟"
    );
    if (!firstConfirm) return;

    const secondConfirm = await showConfirm(
      "⚠️ تأكيد نهائي",
      "هل أنت متأكد؟ لا يمكن التراجع عن هذه العملية!"
    );
    if (!secondConfirm) return;

    setResetting(true);
    try {
      const res = await fetch("/api/backup/reset", { method: "POST" });
      if (res.ok) {
        showSuccess("تم مسح البيانات بنجاح! سيتم تحديث الصفحة.");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showError("حدث خطأ أثناء المسح");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 animate-slide-down">
          <div className="p-3 rounded-xl bg-primary-100">
            <Database className="text-primary-600" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">
              النسخ الاحتياطي والاستعادة
            </h1>
            <p className="text-sm text-[var(--color-neutral-500)] mt-1">
              احفظ بياناتك واستعدها بأمان
            </p>
          </div>
        </div>

        {/* 1. Backup */}
        <div className="bg-[var(--color-card-bg)] p-8 rounded-2xl shadow-sm border border-[var(--color-card-border)] text-center mb-6 hover:shadow-lg transition-all animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success-100 mb-4">
            <span className="text-4xl">💾</span>
          </div>
          <h2 className="text-xl font-extrabold mb-3 text-[var(--color-fg)]">احفظ بياناتك بأمان</h2>
          <p className="text-[var(--color-neutral-500)] mb-6 max-w-md mx-auto">
            سيتم تحميل ملف JSON يحتوي على كل بيانات النظام. احفظ الملف في مكان آمن.
          </p>

          <button
            onClick={handleBackup}
            disabled={loading}
            className="bg-success-400 text-white font-bold py-3.5 px-8 rounded-xl hover:bg-success-500 active:scale-[0.97] transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50 shadow-sm shadow-success-200"
          >
            {loading ? (
              "جاري إنشاء النسخة..."
            ) : downloaded ? (
              <>
                <CheckCircle size={20} /> تم التحميل
              </>
            ) : (
              <>
                <Download size={20} /> تحميل النسخة الاحتياطية
              </>
            )}
          </button>
        </div>

        {/* 2. Backup on Server */}
        <div className="bg-[var(--color-card-bg)] p-8 rounded-2xl shadow-sm border border-[var(--color-card-border)] mb-6 hover:shadow-lg transition-all animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-info-500/10">
              <HardDrive className="text-info-500" size={22} />
            </div>
            <h2 className="text-xl font-extrabold text-[var(--color-fg)]">حفظ على الخادم</h2>
          </div>
          <p className="text-[var(--color-neutral-500)] mb-4 text-sm">
            هيتم حفظ نسخة في فولدر <code className="bg-neutral-100 px-2 py-0.5 rounded font-mono text-xs">backups</code> على الجهاز. يتم الاحتفاظ بآخر 10 نسخ.
          </p>

          {lastBackup && (
            <div className="bg-info-500/10 p-3 rounded-xl text-sm text-info-500 flex items-center gap-2 mb-4">
              <Clock size={16} />
              آخر نسخة محفوظة: {new Date(lastBackup).toLocaleString("ar-EG")}
            </div>
          )}

          <button
            onClick={handleManualBackup}
            disabled={manualBackupSaving}
            className="bg-info-500 text-white font-bold py-3 px-6 rounded-xl hover:opacity-90 active:scale-[0.97] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
          >
            <HardDrive size={18} />
            {manualBackupSaving ? "جاري الحفظ..." : "حفظ نسخة على الخادم"}
          </button>
        </div>

        {/* 3. Auto Backup Settings */}
        <div className="bg-[var(--color-card-bg)] p-8 rounded-2xl shadow-sm border border-[var(--color-card-border)] mb-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-primary-100">
              <Settings className="text-primary-600" size={22} />
            </div>
            <h2 className="text-xl font-extrabold text-[var(--color-fg)]">النسخ التلقائي</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-[var(--color-neutral-50)] p-4 rounded-xl">
              <input
                type="checkbox"
                id="autoBackup"
                checked={autoBackupEnabled}
                onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                className="w-5 h-5 accent-primary-500 cursor-pointer"
              />
              <label
                htmlFor="autoBackup"
                className="text-sm font-bold text-[var(--color-neutral-700)] cursor-pointer flex-1"
              >
                تفعيل النسخ التلقائي
              </label>
            </div>

            {autoBackupEnabled && (
              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5 flex items-center gap-1.5">
                  <Calendar size={14} className="text-[var(--color-neutral-400)]" /> التكرار
                </label>
                <select
                  value={autoBackupFrequency}
                  onChange={(e) => setAutoBackupFrequency(e.target.value)}
                  className="w-full border-2 border-[var(--color-card-border)] bg-[var(--color-card-bg)] text-[var(--color-fg)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                >
                  <option value="DAILY">يومي (كل 24 ساعة)</option>
                  <option value="WEEKLY">أسبوعي (كل 7 أيام)</option>
                </select>
              </div>
            )}

            <button
              onClick={saveAutoBackupSettings}
              disabled={savingAutoSettings}
              className="bg-primary-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-600 active:scale-[0.97] transition-all disabled:opacity-50 shadow-sm shadow-primary-200"
            >
              {savingAutoSettings ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </button>
          </div>
        </div>

        {/* 4. Restore */}
        <div className="bg-[var(--color-card-bg)] p-8 rounded-2xl shadow-sm border border-danger-100 text-center mb-6 hover:shadow-lg transition-all animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-danger-50 mb-4">
            <span className="text-4xl">🔄</span>
          </div>
          <h2 className="text-xl font-extrabold mb-3 text-danger-600">استعادة النسخة الاحتياطية</h2>

          <div className="bg-danger-50 text-danger-700 p-3 rounded-xl mb-5 flex items-start gap-2 text-sm text-right">
            <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
            <span>
              تحذير: سيتم مسح جميع البيانات الحالية واستبدالها ببيانات الملف. لا يمكن التراجع عن هذه العملية.
            </span>
          </div>

          <label className="block w-full border-2 border-dashed border-neutral-300 p-6 rounded-xl mb-4 cursor-pointer hover:border-danger-400 hover:bg-danger-50/30 transition-all">
            <input
              type="file"
              accept=".json"
              onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <Upload size={24} className="mx-auto text-[var(--color-neutral-400)] mb-2" />
            <p className="text-sm font-bold text-[var(--color-neutral-600)]">
              {restoreFile ? restoreFile.name : "اختر ملف النسخة الاحتياطية (.json)"}
            </p>
          </label>

          <button
            onClick={handleRestore}
            disabled={restoring || !restoreFile}
            className="bg-danger-500 text-white font-bold py-3.5 px-8 rounded-xl hover:bg-danger-600 active:scale-[0.97] transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50 shadow-sm shadow-danger-200"
          >
            <Upload size={20} />
            {restoring ? "جاري الاستعادة..." : "استعادة البيانات"}
          </button>
        </div>

        {/* 5. Reset */}
        <div className="bg-[var(--color-card-bg)] p-8 rounded-2xl shadow-sm border border-orange-100 text-center animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-4">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-xl font-extrabold mb-3 text-orange-600">تهيئة قاعدة البيانات</h2>

          <div className="bg-orange-50 text-orange-700 p-3 rounded-xl mb-5 flex items-start gap-2 text-sm text-right">
            <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
            <span>
              تحذير: سيتم مسح جميع البيانات (منتجات، فواتير، عملاء، مشتريات، إلخ) نهائياً، ماعدا المستخدمين. لا يمكن التراجع عن هذه العملية.
            </span>
          </div>

          <button
            onClick={handleReset}
            disabled={resetting}
            className="bg-orange-500 text-white font-bold py-3.5 px-8 rounded-xl hover:bg-orange-600 active:scale-[0.97] transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50 shadow-sm"
          >
            <Trash2 size={20} />
            {resetting ? "جاري المسح..." : "مسح كل البيانات (ماعدا المستخدمين)"}
          </button>
        </div>
      </main>
    </>
  );
}