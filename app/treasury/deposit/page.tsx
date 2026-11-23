"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../components/Header";
import Link from "next/link";
import { ArrowRight, TrendingUp, Wallet, Building2, Check, User, FileText } from "lucide-react";
import { showSuccess, showError } from "@/utils/alerts";

type Cashbox = { id: number; name: string; balance: number };
type BankAccount = { id: number; name: string; balance: number };

export default function DepositPage() {
  const router = useRouter();
  const [cashboxes, setCashboxes] = useState<Cashbox[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [sourceType, setSourceType] = useState<"CASHBOX" | "BANK">("CASHBOX");
  const [sourceId, setSourceId] = useState("");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [responsible, setResponsible] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cbRes, bankRes] = await Promise.all([
          fetch("/api/cashboxes"),
          fetch("/api/bank-accounts"),
        ]);
        if (cbRes.ok) {
          const cb = await cbRes.json();
          setCashboxes(cb);
          if (cb.length > 0) setSourceId(cb[0].id.toString());
        }
        if (bankRes.ok) setBanks(await bankRes.json());
      } catch {
        showError("حدث خطأ");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const selected = sourceType === "CASHBOX"
    ? cashboxes.find((c) => c.id === Number(sourceId))
    : banks.find((b) => b.id === Number(sourceId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || amount <= 0) {
      showError("اختر الخزنة/البنك وأدخل مبلغ صحيح");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/treasury", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "DEPOSIT",
          sourceType,
          sourceId: Number(sourceId),
          amount,
          reason,
          responsible,
        }),
      });

      if (res.ok) {
        showSuccess(`تم إيداع ${amount.toLocaleString("ar-EG")} ج.م`);
        router.push("/treasury");
      } else {
        const data = await res.json();
        showError(data.error || "حدث خطأ");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-20">جاري التحميل...</div>;

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-6 animate-slide-down">
          <Link href="/treasury" className="text-[var(--color-neutral-500)] hover:text-primary-600 hover:bg-primary-50 transition-colors p-2 rounded-lg">
            <ArrowRight size={22} />
          </Link>
          <div className="p-3 rounded-xl bg-success-100">
            <TrendingUp className="text-success-600" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">إيداع</h1>
            <p className="text-sm text-[var(--color-neutral-500)] mt-1">إضافة رصيد للخزنة أو البنك</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] space-y-4 animate-slide-up">
          {/* Source Type */}
          <div className="flex gap-2 p-1.5 bg-[var(--color-bg)] rounded-xl">
            <button
              type="button"
              onClick={() => { setSourceType("CASHBOX"); setSourceId(cashboxes[0]?.id.toString() || ""); }}
              className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                sourceType === "CASHBOX" ? "bg-primary-500 text-white shadow-sm" : "text-[var(--color-neutral-500)] hover:text-primary-600"
              }`}
            >
              <Wallet size={16} /> خزنة
            </button>
            <button
              type="button"
              onClick={() => { setSourceType("BANK"); setSourceId(banks[0]?.id.toString() || ""); }}
              className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                sourceType === "BANK" ? "bg-primary-500 text-white shadow-sm" : "text-[var(--color-neutral-500)] hover:text-primary-600"
              }`}
            >
              <Building2 size={16} /> بنك
            </button>
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">
              {sourceType === "CASHBOX" ? "الخزنة" : "الحساب البنكي"}
            </label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              required
              className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
            >
              <option value="">اختر</option>
              {(sourceType === "CASHBOX" ? cashboxes : banks).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — الرصيد: {item.balance.toLocaleString("ar-EG")}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="bg-info-500/10 p-3 rounded-xl text-sm text-info-500 font-bold">
              الرصيد الحالي: {selected.balance.toLocaleString("ar-EG")} ج.م
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">المبلغ</label>
            <input
              type="number"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              min={0.01}
              step={0.01}
              className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none text-lg font-bold"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5 flex items-center gap-1">
              <User size={12} className="text-[var(--color-neutral-400)]" /> المسؤول
            </label>
            <input
              type="text"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
              placeholder="اسم المودع"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5 flex items-center gap-1">
              <FileText size={12} className="text-[var(--color-neutral-400)]" /> سبب الإيداع
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
              placeholder="مثال: رصيد إضافي"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-success-400 text-white font-bold py-3.5 rounded-xl hover:bg-success-500 active:scale-[0.97] transition-all disabled:opacity-50 shadow-sm shadow-success-200 flex items-center justify-center gap-2"
          >
            <Check size={18} /> {submitting ? "جاري التنفيذ..." : `إيداع ${amount > 0 ? amount.toLocaleString("ar-EG") : ""} ج.م`}
          </button>
        </form>
      </main>
    </>
  );
}