"use client";

import { useState, useEffect } from "react";
import Header from "../../../components/Header";
import Link from "next/link";
import {
  ArrowRight,
  Wallet,
  Building2,
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  FileText,
} from "lucide-react";
import { showError, showSuccess } from "@/utils/alerts";

type Transaction = {
  id: number;
  type: string;
  sourceType: string;
  sourceId: number;
  destType: string | null;
  destId: number | null;
  amount: number;
  reason: string | null;
  responsible: string | null;
  createdAt: string;
};

type NamedItem = { id: number; name: string };

type FilterType = "ALL" | "DEPOSIT" | "WITHDRAW" | "TRANSFER";

export default function TreasuryReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashboxes, setCashboxes] = useState<NamedItem[]>([]);
  const [banks, setBanks] = useState<NamedItem[]>([]);
  const [filterType, setFilterType] = useState<FilterType>("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== "ALL") params.set("type", filterType);
      if (sourceFilter !== "ALL") params.set("sourceType", sourceFilter);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(`/api/treasury/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
        setCashboxes(data.cashboxes);
        setBanks(data.bankAccounts);
      }
    } catch {
      showError("حدث خطأ في جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, sourceFilter]);

  const getName = (type: string, id: number) => {
    if (type === "CASHBOX") return cashboxes.find((c) => c.id === id)?.name || "—";
    return banks.find((b) => b.id === id)?.name || "—";
  };

  const totalDeposits = transactions
    .filter((t) => t.type === "DEPOSIT")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawals = transactions
    .filter((t) => t.type === "WITHDRAW")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalTransfers = transactions
    .filter((t) => t.type === "TRANSFER")
    .reduce((sum, t) => sum + t.amount, 0);

  const exportCSV = () => {
    if (transactions.length === 0) {
      showError("لا توجد بيانات");
      return;
    }
    const headers = ["#", "النوع", "من", "إلى", "المبلغ", "السبب", "المسؤول", "التاريخ"];
    const typeLabel = (t: string) =>
      t === "DEPOSIT" ? "إيداع" : t === "WITHDRAW" ? "سحب" : "تحويل";
    const rows = transactions.map((t) =>
      [
        t.id,
        typeLabel(t.type),
        getName(t.sourceType, t.sourceId),
        t.destType && t.destId ? getName(t.destType, t.destId) : "—",
        t.amount,
        t.reason || "—",
        t.responsible || "—",
        new Date(t.createdAt).toLocaleDateString("ar-EG"),
      ].join(",")
    );
    const blob = new Blob(["\uFEFF" + `${headers.join(",")}\n${rows.join("\n")}`], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `treasury-report-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    showSuccess("تم تصدير الملف");
  };

  const typeBadge = (type: string) => {
    if (type === "DEPOSIT")
      return {
        label: "إيداع",
        color: "bg-success-100 text-success-700",
        Icon: TrendingUp,
      };
    if (type === "WITHDRAW")
      return {
        label: "سحب",
        color: "bg-danger-50 text-danger-700",
        Icon: TrendingDown,
      };
    return {
      label: "تحويل",
      color: "bg-info-500/10 text-info-500",
      Icon: ArrowLeftRight,
    };
  };

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 animate-slide-down">
          <div className="flex items-center gap-3">
            <Link
              href="/treasury"
              className="text-[var(--color-neutral-500)] hover:text-primary-600 hover:bg-primary-50 transition-colors p-2 rounded-lg"
            >
              <ArrowRight size={22} />
            </Link>
            <div className="p-3 rounded-xl bg-primary-100">
              <FileText className="text-primary-600" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">
                تقارير الخزنة والبنك
              </h1>
              <p className="text-sm text-[var(--color-neutral-500)] mt-1">
                {transactions.length} حركة
              </p>
            </div>
          </div>
          <button
            onClick={exportCSV}
            className="bg-success-400 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-success-500 active:scale-[0.97] transition-all shadow-sm shadow-success-200 text-sm"
          >
            <Download size={16} /> تصدير CSV
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 stagger-children">
          <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success-100">
              <TrendingUp className="text-success-600" size={20} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-neutral-500)]">إجمالي الإيداعات</div>
              <div className="text-lg font-extrabold text-success-600">
                {totalDeposits.toLocaleString("ar-EG")} ج.م
              </div>
            </div>
          </div>
          <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-danger-50">
              <TrendingDown className="text-danger-500" size={20} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-neutral-500)]">إجمالي السحب</div>
              <div className="text-lg font-extrabold text-danger-600">
                {totalWithdrawals.toLocaleString("ar-EG")} ج.م
              </div>
            </div>
          </div>
          <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-info-500/10">
              <ArrowLeftRight className="text-info-500" size={20} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-neutral-500)]">إجمالي التحويلات</div>
              <div className="text-lg font-extrabold text-info-500">
                {totalTransfers.toLocaleString("ar-EG")} ج.م
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl shadow-sm border border-[var(--color-card-border)] mb-6 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">
                نوع الحركة
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
              >
                <option value="ALL">الكل</option>
                <option value="DEPOSIT">إيداع</option>
                <option value="WITHDRAW">سحب</option>
                <option value="TRANSFER">تحويل</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">
                المصدر
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
              >
                <option value="ALL">الكل</option>
                <option value="CASHBOX">خزنة</option>
                <option value="BANK">بنك</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} className="text-[var(--color-neutral-400)]" /> من تاريخ
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} className="text-[var(--color-neutral-400)]" /> إلى تاريخ
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="flex-1 border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
                />
                <button
                  onClick={fetchData}
                  className="bg-primary-500 text-white px-4 rounded-xl font-bold hover:bg-primary-600 transition-all text-sm"
                >
                  بحث
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] overflow-x-auto animate-slide-up">
          <table className="w-full text-right">
            <thead className="bg-[var(--color-bg)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
              <tr>
                <th className="p-4 font-bold">#</th>
                <th className="p-4 font-bold">النوع</th>
                <th className="p-4 font-bold">من</th>
                <th className="p-4 font-bold">إلى</th>
                <th className="p-4 font-bold">المبلغ</th>
                <th className="p-4 font-bold">السبب</th>
                <th className="p-4 font-bold">المسؤول</th>
                <th className="p-4 font-bold">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-[var(--color-neutral-500)]">
                    جاري التحميل...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <FileText className="mx-auto text-neutral-300 mb-3" size={48} />
                    <p className="text-[var(--color-neutral-500)]">لا توجد حركات.</p>
                  </td>
                </tr>
              ) : (
                transactions.map((t) => {
                  const badge = typeBadge(t.type);
                  const Icon = badge.Icon;
                  return (
                    <tr key={t.id} className="hover:bg-primary-50/30 transition-colors">
                      <td className="p-4 font-mono text-sm text-[var(--color-neutral-500)]">#{t.id}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 ${badge.color}`}
                        >
                          <Icon size={12} /> {badge.label}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-[var(--color-neutral-700)] inline-flex items-center gap-1.5">
                        {t.sourceType === "CASHBOX" ? (
                          <Wallet size={14} className="text-primary-500" />
                        ) : (
                          <Building2 size={14} className="text-info-500" />
                        )}
                        {getName(t.sourceType, t.sourceId)}
                      </td>
                      <td className="p-4 text-sm text-[var(--color-neutral-700)]">
                        {t.destType && t.destId ? (
                          <span className="inline-flex items-center gap-1.5">
                            {t.destType === "CASHBOX" ? (
                              <Wallet size={14} className="text-primary-500" />
                            ) : (
                              <Building2 size={14} className="text-info-500" />
                            )}
                            {getName(t.destType, t.destId)}
                          </span>
                        ) : (
                          <span className="text-[var(--color-neutral-400)]">—</span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-[var(--color-fg)]">
                        {t.amount.toLocaleString("ar-EG")} ج.م
                      </td>
                      <td className="p-4 text-sm text-[var(--color-neutral-500)]">{t.reason || "—"}</td>
                      <td className="p-4 text-sm text-[var(--color-neutral-500)]">
                        {t.responsible || "—"}
                      </td>
                      <td className="p-4 text-sm text-[var(--color-neutral-500)]">
                        {new Date(t.createdAt).toLocaleDateString("ar-EG")}
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