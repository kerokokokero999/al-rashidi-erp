"use client";

import { useState, useEffect } from "react";
import Header from "../../../components/Header";
import Link from "next/link";
import {
  ReceiptText,
  Plus,
  Trash2,
  Calendar,
  Search,
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
} from "lucide-react";
import { showSuccess, showError, showConfirm } from "@/utils/alerts";

type Voucher = {
  id: number;
  voucherNumber: number;
  type: string;
  amount: number;
  partyName: string;
  reason: string | null;
  responsible: string | null;
  cashboxId: number | null;
  bankAccountId: number | null;
  cashbox?: { id: number; name: string } | null;
  bankAccount?: { id: number; name: string } | null;
  createdAt: string;
};

export default function VouchersReportPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [filterType, setFilterType] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== "ALL") params.set("type", filterType);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(`/api/vouchers?${params.toString()}`);
      if (res.ok) setVouchers(await res.json());
    } catch {
      showError("حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm(
      "حذف السند",
      "هل أنت متأكد؟ سيتم عكس الرصيد في الخزنة/البنك."
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/vouchers/${id}`, { method: "DELETE" });
      if (res.ok) {
        showSuccess("تم الحذف");
        fetchData();
      } else {
        showError("حدث خطأ");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    }
  };

  const filtered = vouchers.filter((v) => {
    const term = search.toLowerCase();
    if (!term) return true;
    return (
      v.partyName.toLowerCase().includes(term) ||
      v.reason?.toLowerCase().includes(term) ||
      v.voucherNumber.toString().includes(term)
    );
  });

  const getSourceName = (v: Voucher) => {
    if (v.cashbox) return v.cashbox.name;
    if (v.bankAccount) return v.bankAccount.name;
    return "—";
  };

  const getSourceType = (v: Voucher) => {
    if (v.cashbox) return "CASHBOX";
    if (v.bankAccount) return "BANK";
    return null;
  };

  const totalReceipts = vouchers
    .filter((v) => v.type === "RECEIPT")
    .reduce((sum, v) => sum + v.amount, 0);
  const totalPayments = vouchers
    .filter((v) => v.type === "PAYMENT")
    .reduce((sum, v) => sum + v.amount, 0);

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-100">
              <ReceiptText className="text-primary-600" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">سندات القبض والصرف</h1>
              <p className="text-sm text-[var(--color-neutral-500)] mt-1">{vouchers.length} سند</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/vouchers/receipt"
              className="bg-success-400 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-success-500 active:scale-[0.97] transition-all shadow-sm shadow-success-200 text-sm"
            >
              <Plus size={16} /> سند قبض
            </Link>
            <Link
              href="/vouchers/payment"
              className="bg-danger-500 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-danger-600 active:scale-[0.97] transition-all shadow-sm shadow-danger-200 text-sm"
            >
              <Plus size={16} /> سند صرف
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 stagger-children">
          <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success-100">
              <TrendingUp className="text-success-600" size={20} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-neutral-500)]">إجمالي القبض</div>
              <div className="text-xl font-extrabold text-success-600">
                {totalReceipts.toLocaleString("ar-EG")} ج.م
              </div>
            </div>
          </div>
          <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-danger-50">
              <TrendingDown className="text-danger-500" size={20} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-neutral-500)]">إجمالي الصرف</div>
              <div className="text-xl font-extrabold text-danger-600">
                {totalPayments.toLocaleString("ar-EG")} ج.م
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl shadow-sm border border-[var(--color-card-border)] mb-6 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
            >
              <option value="ALL">كل السندات</option>
              <option value="RECEIPT">سندات قبض</option>
              <option value="PAYMENT">سندات صرف</option>
            </select>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
            />
            <button
              onClick={fetchData}
              className="bg-primary-500 text-white p-3 rounded-xl font-bold hover:bg-primary-600 active:scale-[0.97] transition-all text-sm"
            >
              بحث
            </button>
          </div>
          <div className="relative mt-3">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]" size={16} />
            <input
              type="text"
              placeholder="ابحث بالاسم أو السبب أو رقم السند..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-2 border-[var(--color-neutral-200)] p-3 pr-10 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] overflow-x-auto animate-slide-up">
          <table className="w-full text-right">
            <thead className="bg-[var(--color-bg)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
              <tr>
                <th className="p-4 font-bold">رقم السند</th>
                <th className="p-4 font-bold">النوع</th>
                <th className="p-4 font-bold">المبلغ</th>
                <th className="p-4 font-bold">الجهة</th>
                <th className="p-4 font-bold">الخزنة/البنك</th>
                <th className="p-4 font-bold">السبب</th>
                <th className="p-4 font-bold">المسؤول</th>
                <th className="p-4 font-bold">التاريخ</th>
                <th className="p-4 font-bold text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr><td colSpan={9} className="p-12 text-center text-[var(--color-neutral-500)]">جاري التحميل...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <ReceiptText className="mx-auto text-neutral-300 mb-3" size={48} />
                    <p className="text-[var(--color-neutral-500)]">لا توجد سندات.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((v) => {
                  const isReceipt = v.type === "RECEIPT";
                  const sourceType = getSourceType(v);
                  return (
                    <tr key={v.id} className="hover:bg-primary-50/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-primary-600">
                        #{v.voucherNumber}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 ${
                            isReceipt
                              ? "bg-success-100 text-success-700"
                              : "bg-danger-50 text-danger-700"
                          }`}
                        >
                          {isReceipt ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {isReceipt ? "قبض" : "صرف"}
                        </span>
                      </td>
                      <td className={`p-4 font-bold ${isReceipt ? "text-success-600" : "text-danger-600"}`}>
                        {v.amount.toLocaleString("ar-EG")} ج.م
                      </td>
                      <td className="p-4 font-bold text-[var(--color-fg)]">{v.partyName}</td>
                      <td className="p-4 text-sm text-[var(--color-neutral-600)]">
                        {sourceType ? (
                          <span className="inline-flex items-center gap-1.5">
                            {sourceType === "CASHBOX" ? (
                              <Wallet size={14} className="text-primary-500" />
                            ) : (
                              <Building2 size={14} className="text-info-500" />
                            )}
                            {getSourceName(v)}
                          </span>
                        ) : (
                          <span className="text-[var(--color-neutral-400)]">—</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-[var(--color-neutral-500)]">{v.reason || "—"}</td>
                      <td className="p-4 text-sm text-[var(--color-neutral-500)]">{v.responsible || "—"}</td>
                      <td className="p-4 text-sm text-[var(--color-neutral-500)]">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar size={12} className="text-[var(--color-neutral-400)]" />
                          {new Date(v.createdAt).toLocaleDateString("ar-EG")}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="p-2 bg-danger-50 text-danger-600 rounded-lg hover:bg-danger-100 transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}