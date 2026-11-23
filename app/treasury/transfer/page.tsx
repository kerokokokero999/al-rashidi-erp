"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../components/Header";
import Link from "next/link";
import { ArrowRight, ArrowLeftRight, Wallet, Building2, Check, User, FileText } from "lucide-react";
import { showSuccess, showError } from "@/utils/alerts";

type Cashbox = { id: number; name: string; balance: number };
type BankAccount = { id: number; name: string; balance: number };

export default function TransferPage() {
  const router = useRouter();
  const [cashboxes, setCashboxes] = useState<Cashbox[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [sourceType, setSourceType] = useState<"CASHBOX" | "BANK">("CASHBOX");
  const [destType, setDestType] = useState<"CASHBOX" | "BANK">("CASHBOX");
  const [sourceId, setSourceId] = useState("");
  const [destId, setDestId] = useState("");
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
        if (bankRes.ok) {
          const b = await bankRes.json();
          setBanks(b);
          if (b.length > 0) setDestId(b[0].id.toString());
        }
      } catch {
        showError("حدث خطأ");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const source = sourceType === "CASHBOX"
    ? cashboxes.find((c) => c.id === Number(sourceId))
    : banks.find((b) => b.id === Number(sourceId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !destId || amount <= 0) {
      showError("اختر المصدر والمستقبل وأدخل مبلغ صحيح");
      return;
    }
    if (sourceType === destType && sourceId === destId) {
      showError("لا يمكن التحويل لنفس الحساب");
      return;
    }
    if (source && amount > source.balance) {
      showError(`الرصيد غير كافٍ. المتاح: ${source.balance.toLocaleString("ar-EG")} ج.م`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/treasury", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "TRANSFER",
          sourceType,
          sourceId: Number(sourceId),
          destType,
          destId: Number(destId),
          amount,
          reason,
          responsible,
        }),
      });

      if (res.ok) {
        showSuccess(`تم تحويل ${amount.toLocaleString("ar-EG")} ج.م`);
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
          <div className="p-3 rounded-xl bg-info-500/10">
            <ArrowLeftRight className="text-info-500" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">تحويل</h1>
            <p className="text-sm text-[var(--color-neutral-500)] mt-1">بين الخزائن والبنوك</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] space-y-4 animate-slide-up">
          {/* From */}
          <div>
            <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">من</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => { setSourceType("CASHBOX"); setSourceId(cashboxes[0]?.id.toString() || ""); }}
                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 ${
                  sourceType === "CASHBOX" ? "bg-primary-500 text-white" : "bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]"
                }`}
              >
                <Wallet size={14} /> خزنة
              </button>
              <button
                type="button"
                onClick={() => { setSourceType("BANK"); setSourceId(banks[0]?.id.toString() || ""); }}
                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 ${
                  sourceType === "BANK" ? "bg-primary-500 text-white" : "bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]"
                }`}
              >
                <Building2 size={14} /> بنك
              </button>
            </div>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              required
              className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
            >
              <option value="">اختر</option>
              {(sourceType === "CASHBOX" ? cashboxes : banks).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {item.balance.toLocaleString("ar-EG")}
                </option>
              ))}
            </select>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="p-2 rounded-full bg-info-500/10">
              <ArrowLeftRight className="text-info-500" size={20} />
            </div>
          </div>

          {/* To */}
          <div>
            <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">إلى</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => { setDestType("CASHBOX"); setDestId(cashboxes[0]?.id.toString() || ""); }}
                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 ${
                  destType === "CASHBOX" ? "bg-success-400 text-white" : "bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]"
                }`}
              >
                <Wallet size={14} /> خزنة
              </button>
              <button
                type="button"
                onClick={() => { setDestType("BANK"); setDestId(banks[0]?.id.toString() || ""); }}
                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 ${
                  destType === "BANK" ? "bg-success-400 text-white" : "bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]"
                }`}
              >
                <Building2 size={14} /> بنك
              </button>
            </div>
            <select
              value={destId}
              onChange={(e) => setDestId(e.target.value)}
              required
              className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
            >
              <option value="">اختر</option>
              {(destType === "CASHBOX" ? cashboxes : banks).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {source && (
            <div className="bg-info-500/10 p-3 rounded-xl text-sm text-info-500 font-bold">
              رصيد المصدر: {source.balance.toLocaleString("ar-EG")} ج.م
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
              max={source?.balance}
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
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5 flex items-center gap-1">
              <FileText size={12} className="text-[var(--color-neutral-400)]" /> سبب التحويل
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-info-500 text-white font-bold py-3.5 rounded-xl hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
          >
            <Check size={18} /> {submitting ? "جاري التنفيذ..." : `تحويل ${amount > 0 ? amount.toLocaleString("ar-EG") : ""} ج.م`}
          </button>
        </form>
      </main>
    </>
  );
}