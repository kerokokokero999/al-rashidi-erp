"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../components/Header";
import Link from "next/link";
import { ArrowRight, Wallet, Building2, Check, User, FileText } from "lucide-react";
import { showSuccess, showError } from "@/utils/alerts";

type Cashbox = { id: number; name: string; balance: number };
type BankAccount = { id: number; name: string; balance: number };

export default function PaymentVoucherPage() {
  const router = useRouter();
  const [cashboxes, setCashboxes] = useState<Cashbox[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [sourceType, setSourceType] = useState<"CASHBOX" | "BANK">("CASHBOX");
  const [sourceId, setSourceId] = useState("");
  const [amount, setAmount] = useState(0);
  const [partyName, setPartyName] = useState("");
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
    if (amount <= 0 || !partyName) {
      showError("أكمل البيانات");
      return;
    }
    if (selected && amount > selected.balance) {
      showError(`الرصيد غير كافٍ. المتاح: ${selected.balance.toLocaleString("ar-EG")} ج.م`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "PAYMENT",
          amount,
          partyName,
          reason,
          responsible,
          cashboxId: sourceType === "CASHBOX" ? Number(sourceId) : null,
          bankAccountId: sourceType === "BANK" ? Number(sourceId) : null,
        }),
      });

      if (res.ok) {
        showSuccess(`تم تسجيل سند صرف بقيمة ${amount.toLocaleString("ar-EG")} ج.م`);
        router.push("/vouchers/report");
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
          <Link
            href="/vouchers/report"
            className="text-[var(--color-neutral-500)] hover:text-primary-600 hover:bg-primary-50 transition-colors p-2 rounded-lg"
          >
            <ArrowRight size={22} />
          </Link>
          <div className="p-3 rounded-xl bg-danger-50">
            <FileText className="text-danger-500" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">سند صرف</h1>
            <p className="text-sm text-[var(--color-neutral-500)] mt-1">تسجيل مبلغ صرف</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] space-y-4 animate-slide-up">
          <div>
            <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">المبلغ</label>
            <input
              type="number"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              min={0.01}
              step={0.01}
              max={selected?.balance}
              className="w-full border-2 border-[var(--color-neutral-200)] p-4 rounded-xl focus:border-primary-400 focus:outline-none text-2xl font-extrabold text-center text-danger-600"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5 flex items-center gap-1">
              <User size={12} className="text-[var(--color-neutral-400)]" /> صرف إلى
            </label>
            <input
              type="text"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              required
              className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
              placeholder="اسم الشخص / الجهة"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">خصم من</label>
            <div className="flex gap-2 p-1.5 bg-[var(--color-bg)] rounded-xl mb-2">
              <button
                type="button"
                onClick={() => { setSourceType("CASHBOX"); setSourceId(cashboxes[0]?.id.toString() || ""); }}
                className={`flex-1 px-3 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                  sourceType === "CASHBOX" ? "bg-primary-500 text-white" : "text-[var(--color-neutral-500)] hover:text-primary-600"
                }`}
              >
                <Wallet size={14} /> خزنة
              </button>
              <button
                type="button"
                onClick={() => { setSourceType("BANK"); setSourceId(banks[0]?.id.toString() || ""); }}
                className={`flex-1 px-3 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                  sourceType === "BANK" ? "bg-primary-500 text-white" : "text-[var(--color-neutral-500)] hover:text-primary-600"
                }`}
              >
                <Building2 size={14} /> بنك
              </button>
            </div>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
            >
              {(sourceType === "CASHBOX" ? cashboxes : banks).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {item.balance.toLocaleString("ar-EG")} ج.م
                </option>
              ))}
            </select>
            {selected && (
              <div className="mt-2 bg-info-500/10 p-2 rounded-lg text-xs text-info-500 font-bold">
                الرصيد الحالي: {selected.balance.toLocaleString("ar-EG")} ج.م
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5 flex items-center gap-1">
              <FileText size={12} className="text-[var(--color-neutral-400)]" /> السبب
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
              placeholder="مثال: مصروفات"
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
              placeholder="اسم الصارف"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-danger-500 text-white font-bold py-3.5 rounded-xl hover:bg-danger-600 active:scale-[0.97] transition-all disabled:opacity-50 shadow-sm shadow-danger-200 flex items-center justify-center gap-2"
          >
            <Check size={18} /> {submitting ? "جاري الحفظ..." : `صرف ${amount > 0 ? amount.toLocaleString("ar-EG") : ""} ج.م`}
          </button>
        </form>
      </main>
    </>
  );
}