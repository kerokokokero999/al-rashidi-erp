"use client";

import { useState, useEffect } from "react";
import Header from "../../components/Header";
import Link from "next/link";
import { ClipboardList, Plus, Eye } from "lucide-react";
import { showSuccess, showError } from "@/utils/alerts";

type Audit = {
  id: number;
  name: string;
  status: string;
  createdAt: string;
  items: unknown[];
};

export default function AuditsPage() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAuditName, setNewAuditName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const fetchAudits = async () => {
    const res = await fetch("/api/audits");
    if (res.ok) setAudits(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAudits();
  }, []);

  const createAudit = async () => {
    if (!newAuditName) {
      showError("يرجى إدخال اسم الجلسة");
      return;
    }
    const res = await fetch("/api/audits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newAuditName }),
    });
    if (res.ok) {
      showSuccess("تم فتح جلسة جرد جديدة");
      setNewAuditName("");
      setIsAdding(false);
      fetchAudits();
    } else {
      showError("حدث خطأ");
    }
  };

  if (loading)
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-pulse-soft">
          <ClipboardList className="text-primary-500 mx-auto mb-4" size={48} />
          <p className="text-[var(--color-neutral-500)] font-bold">جاري التحميل...</p>
        </div>
      </div>
    );

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-100">
              <ClipboardList className="text-primary-600" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">جلسات الجرد</h1>
              <p className="text-sm text-[var(--color-neutral-500)] mt-1">إدارة ومراجعة جلسات الجرد</p>
            </div>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-primary-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-600 active:scale-[0.97] transition-all shadow-sm shadow-primary-200"
          >
            <Plus size={18} /> {isAdding ? "إلغاء" : "فتح جلسة جديدة"}
          </button>
        </div>

        {/* Add form */}
        {isAdding && (
          <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] mb-6 animate-slide-down">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="اسم الجلسة (مثلاً: جرد يناير 2026)"
                value={newAuditName}
                onChange={(e) => setNewAuditName(e.target.value)}
                className="flex-1 border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all"
              />
              <button
                onClick={createAudit}
                className="bg-success-400 text-white px-6 rounded-xl font-bold hover:bg-success-500 active:scale-[0.97] transition-all"
              >
                فتح الجلسة
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] overflow-hidden animate-slide-up">
          <table className="w-full text-right">
            <thead className="bg-[var(--color-bg)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
              <tr>
                <th className="p-4 font-bold">اسم الجلسة</th>
                <th className="p-4 font-bold">التاريخ</th>
                <th className="p-4 font-bold">الحالة</th>
                <th className="p-4 font-bold text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {audits.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center">
                    <ClipboardList className="mx-auto text-neutral-300 mb-3" size={48} />
                    <p className="text-[var(--color-neutral-500)]">لا توجد جلسات جرد.</p>
                  </td>
                </tr>
              ) : (
                audits.map((audit) => (
                  <tr key={audit.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="p-4 font-bold text-[var(--color-fg)]">{audit.name}</td>
                    <td className="p-4 text-sm text-[var(--color-neutral-600)]">
                      {new Date(audit.createdAt).toLocaleString("ar-EG")}
                    </td>
                    <td className="p-4">
                      {audit.status === "OPEN" ? (
                        <span className="bg-warning-500/10 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
                          مفتوحة
                        </span>
                      ) : (
                        <span className="bg-success-100 text-success-700 px-3 py-1 rounded-full text-xs font-bold">
                          مكتملة
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <Link
                        href={`/audits/${audit.id}`}
                        className="bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg text-sm font-bold inline-flex items-center gap-1 hover:bg-primary-100 transition-colors"
                      >
                        <Eye size={16} /> عرض / جرد
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}