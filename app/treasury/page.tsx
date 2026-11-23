"use client";

import { useState, useEffect } from "react";
import Header from "../../components/Header";
import Link from "next/link";
import {
  Wallet,
  Building2,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Package,
  Eye,
  Edit,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { showSuccess, showError, showConfirm } from "@/utils/alerts";

type Cashbox = {
  id: number;
  name: string;
  balance: number;
  isActive: boolean;
  branch?: { name: string } | null;
};

type BankAccount = {
  id: number;
  name: string;
  bankName: string | null;
  accountNumber: string | null;
  balance: number;
  isActive: boolean;
  branch?: { name: string } | null;
};

type Branch = { id: number; name: string };

export default function TreasuryPage() {
  const [cashboxes, setCashboxes] = useState<Cashbox[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"cashboxes" | "banks">("cashboxes");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Cashbox | BankAccount | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    bankName: "",
    accountNumber: "",
    branchId: "",
    balance: 0,
  });

  const fetchData = async () => {
    try {
      const [cbRes, bankRes, brRes] = await Promise.all([
        fetch("/api/cashboxes"),
        fetch("/api/bank-accounts"),
        fetch("/api/branches"),
      ]);
      if (cbRes.ok) setCashboxes(await cbRes.json());
      if (bankRes.ok) setBankAccounts(await bankRes.json());
      if (brRes.ok) setBranches(await brRes.json());
    } catch {
      showError("حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const openForm = (item?: Cashbox | BankAccount) => {
    if (item) {
      setEditing(item);
      setFormData({
        name: item.name,
        bankName: "bankName" in item ? item.bankName || "" : "",
        accountNumber: "accountNumber" in item ? item.accountNumber || "" : "",
        branchId: item.branch ? "" : "",
        balance: item.balance,
      });
    } else {
      setEditing(null);
      setFormData({ name: "", bankName: "", accountNumber: "", branchId: "", balance: 0 });
    }
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditing(null);
    setFormData({ name: "", bankName: "", accountNumber: "", branchId: "", balance: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const isBank = activeTab === "banks";
      const url = editing
        ? `/${isBank ? "api/bank-accounts" : "api/cashboxes"}/${editing.id}`
        : `/${isBank ? "api/bank-accounts" : "api/cashboxes"}`;
      const method = editing ? "PUT" : "POST";

      const payload: Record<string, unknown> = {
        name: formData.name,
        branchId: formData.branchId || null,
        isActive: true,
      };
      if (!editing) payload.balance = Number(formData.balance) || 0;
      if (isBank) {
        payload.bankName = formData.bankName || null;
        payload.accountNumber = formData.accountNumber || null;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showSuccess(editing ? "تم التعديل" : "تم الإضافة");
        cancelForm();
        fetchData();
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

  const handleDelete = async (id: number, type: "cashbox" | "bank") => {
    const confirmed = await showConfirm("حذف", "هل أنت متأكد؟");
    if (!confirmed) return;

    try {
      const res = await fetch(
        type === "cashbox" ? `/api/cashboxes/${id}` : `/api/bank-accounts/${id}`,
        { method: "DELETE" }
      );
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

  const totalCashboxes = cashboxes.reduce((sum, c) => sum + c.balance, 0);
  const totalBanks = bankAccounts.reduce((sum, b) => sum + b.balance, 0);
  const total = totalCashboxes + totalBanks;

  if (loading)
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-pulse-soft">
          <Wallet className="text-primary-500 mx-auto mb-4" size={48} />
          <p className="text-[var(--color-neutral-500)] font-bold">جاري التحميل...</p>
        </div>
      </div>
    );

  const currentList = activeTab === "cashboxes" ? cashboxes : bankAccounts;

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-100">
              <Wallet className="text-primary-600" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">الخزنة والبنك</h1>
              <p className="text-sm text-[var(--color-neutral-500)] mt-1">إدارة الأرصدة والعمليات المالية</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 stagger-children">
          <div className="bg-[var(--color-card-bg)] p-5 rounded-2xl border border-[var(--color-card-border)] flex items-center gap-3">
            <div className="p-3 rounded-xl bg-success-100">
              <Wallet className="text-success-600" size={22} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-neutral-500)] mb-0.5">إجمالي الخزائن</div>
              <div className="text-2xl font-extrabold text-success-600">
                {totalCashboxes.toLocaleString("ar-EG")} ج.م
              </div>
            </div>
          </div>
          <div className="bg-[var(--color-card-bg)] p-5 rounded-2xl border border-[var(--color-card-border)] flex items-center gap-3">
            <div className="p-3 rounded-xl bg-info-500/10">
              <Building2 className="text-info-500" size={22} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-neutral-500)] mb-0.5">إجمالي البنوك</div>
              <div className="text-2xl font-extrabold text-info-500">
                {totalBanks.toLocaleString("ar-EG")} ج.م
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-5 rounded-2xl text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-[var(--color-card-bg)]/20">
                <TrendingUp size={22} />
              </div>
              <div>
                <div className="text-xs text-primary-100 mb-0.5">الإجمالي الكلي</div>
                <div className="text-2xl font-extrabold">{total.toLocaleString("ar-EG")} ج.م</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 animate-slide-up">
          <Link href="/treasury/deposit" className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)] hover:border-success-300 hover:shadow-md transition-all flex items-center gap-3 group">
            <div className="p-2.5 rounded-xl bg-success-100">
              <TrendingUp className="text-success-600" size={20} />
            </div>
            <div>
              <div className="font-bold text-[var(--color-fg)] group-hover:text-success-600 text-sm">إيداع</div>
              <div className="text-xs text-[var(--color-neutral-500)]">إضافة رصيد</div>
            </div>
          </Link>
          <Link href="/treasury/withdraw" className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)] hover:border-danger-300 hover:shadow-md transition-all flex items-center gap-3 group">
            <div className="p-2.5 rounded-xl bg-danger-50">
              <TrendingDown className="text-danger-500" size={20} />
            </div>
            <div>
              <div className="font-bold text-[var(--color-fg)] group-hover:text-danger-600 text-sm">سحب</div>
              <div className="text-xs text-[var(--color-neutral-500)]">خصم رصيد</div>
            </div>
          </Link>
          <Link href="/treasury/transfer" className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)] hover:border-info-300 hover:shadow-md transition-all flex items-center gap-3 group">
            <div className="p-2.5 rounded-xl bg-info-500/10">
              <ArrowLeftRight className="text-info-500" size={20} />
            </div>
            <div>
              <div className="font-bold text-[var(--color-fg)] group-hover:text-info-500 text-sm">تحويل</div>
              <div className="text-xs text-[var(--color-neutral-500)]">بين الخزائن والبنوك</div>
            </div>
          </Link>
          <Link href="/treasury/report" className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)] hover:border-orange-300 hover:shadow-md transition-all flex items-center gap-3 group">
            <div className="p-2.5 rounded-xl bg-orange-100">
              <Eye className="text-orange-600" size={20} />
            </div>
            <div>
              <div className="font-bold text-[var(--color-fg)] group-hover:text-orange-600 text-sm">تقارير</div>
              <div className="text-xs text-[var(--color-neutral-500)]">كل الحركات</div>
            </div>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 bg-[var(--color-card-bg)] p-1.5 rounded-xl border border-[var(--color-card-border)] w-fit animate-slide-up">
          <button
            onClick={() => setActiveTab("cashboxes")}
            className={`px-5 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 text-sm ${
              activeTab === "cashboxes" ? "bg-primary-500 text-white shadow-sm" : "text-[var(--color-neutral-500)] hover:text-primary-600"
            }`}
          >
            <Wallet size={16} /> الخزائن ({cashboxes.length})
          </button>
          <button
            onClick={() => setActiveTab("banks")}
            className={`px-5 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 text-sm ${
              activeTab === "banks" ? "bg-primary-500 text-white shadow-sm" : "text-[var(--color-neutral-500)] hover:text-primary-600"
            }`}
          >
            <Building2 size={16} /> البنوك ({bankAccounts.length})
          </button>
        </div>

        {/* Add Button */}
        <div className="mb-4">
          <button
            onClick={() => openForm()}
            className="bg-primary-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-600 active:scale-[0.97] transition-all shadow-sm shadow-primary-200"
          >
            <Plus size={18} /> {activeTab === "cashboxes" ? "إضافة خزنة" : "إضافة حساب بنكي"}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-primary-100 mb-6 animate-slide-down">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-extrabold text-[var(--color-fg)]">
                {editing ? "تعديل" : "إضافة"} {activeTab === "cashboxes" ? "خزنة" : "حساب بنكي"}
              </h2>
              <button onClick={cancelForm} className="p-2 rounded-lg text-[var(--color-neutral-400)] hover:text-danger-600 hover:bg-danger-50">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="الاسم"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
              />
              {activeTab === "banks" && (
                <>
                  <input
                    type="text"
                    placeholder="اسم البنك"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="رقم الحساب"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                    dir="ltr"
                  />
                </>
              )}
              <select
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
              >
                <option value="">بدون فرع</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              {!editing && (
                <input
                  type="number"
                  placeholder="الرصيد الافتتاحي"
                  value={formData.balance || ""}
                  onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                  className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
                />
              )}
              <button
                type="submit"
                disabled={submitting}
                className="md:col-span-3 bg-primary-500 text-white py-3 rounded-xl font-bold hover:bg-primary-600 active:scale-[0.97] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check size={18} /> {submitting ? "جاري الحفظ..." : "حفظ"}
              </button>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] overflow-x-auto animate-slide-up">
          <table className="w-full text-right">
            <thead className="bg-[var(--color-bg)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
              <tr>
                <th className="p-4 font-bold">الاسم</th>
                {activeTab === "banks" && (
                  <>
                    <th className="p-4 font-bold">البنك</th>
                    <th className="p-4 font-bold">رقم الحساب</th>
                  </>
                )}
                <th className="p-4 font-bold">الفرع</th>
                <th className="p-4 font-bold">الرصيد</th>
                <th className="p-4 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === "banks" ? 6 : 4} className="p-12 text-center">
                    {activeTab === "cashboxes" ? (
                      <Wallet className="mx-auto text-neutral-300 mb-3" size={48} />
                    ) : (
                      <Building2 className="mx-auto text-neutral-300 mb-3" size={48} />
                    )}
                    <p className="text-[var(--color-neutral-500)]">
                      لا توجد {activeTab === "cashboxes" ? "خزائن" : "حسابات بنكية"}.
                    </p>
                  </td>
                </tr>
              ) : (
                currentList.map((item) => {
                  const isBank = "bankName" in item;
                  return (
                    <tr key={item.id} className="hover:bg-primary-50/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isBank ? "bg-info-500/10" : "bg-primary-100"}`}>
                            {isBank ? <Building2 size={16} className="text-info-500" /> : <Wallet size={16} className="text-primary-600" />}
                          </div>
                          <span className="font-bold text-[var(--color-fg)]">{item.name}</span>
                        </div>
                      </td>
                      {isBank && (
                        <>
                          <td className="p-4 text-sm text-[var(--color-neutral-600)]">{(item as BankAccount).bankName || "—"}</td>
                          <td className="p-4 text-sm text-[var(--color-neutral-600)] font-mono" dir="ltr">
                            {(item as BankAccount).accountNumber || "—"}
                          </td>
                        </>
                      )}
                      <td className="p-4 text-sm text-[var(--color-neutral-600)]">
                        {item.branch?.name || "—"}
                      </td>
                      <td className="p-4 font-bold text-success-600 text-lg">
                        {item.balance.toLocaleString("ar-EG")} ج.م
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openForm(item)}
                            className="p-2 bg-info-500/10 text-info-500 rounded-lg hover:bg-info-500/20 transition-colors"
                            title="تعديل"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, isBank ? "bank" : "cashbox")}
                            className="p-2 bg-danger-50 text-danger-600 rounded-lg hover:bg-danger-100 transition-colors"
                            title="حذف"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
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