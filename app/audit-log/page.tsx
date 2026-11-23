"use client";

import { useState, useEffect } from "react";
import Header from "../../components/Header";
import {
  FileText,
  Search,
  Calendar,
  Download,
  Plus,
  Edit,
  Trash2,
  LogIn,
  LogOut,
  User,
  Clock,
} from "lucide-react";
import { showError, showSuccess } from "@/utils/alerts";

type AuditLog = {
  id: number;
  action: string;
  entity: string;
  entityId: number | null;
  description: string | null;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  metadata: string | null;
  createdAt: string;
};

const actionConfig: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  CREATE: { label: "إضافة", color: "text-success-700", bg: "bg-success-100", Icon: Plus },
  UPDATE: { label: "تعديل", color: "text-info-500", bg: "bg-info-500/10", Icon: Edit },
  DELETE: { label: "حذف", color: "text-danger-700", bg: "bg-danger-50", Icon: Trash2 },
  LOGIN: { label: "دخول", color: "text-primary-700", bg: "bg-primary-100", Icon: LogIn },
  LOGOUT: { label: "خروج", color: "text-orange-700", bg: "bg-orange-100", Icon: LogOut },
};

const entityLabels: Record<string, string> = {
  Product: "منتج",
  Invoice: "فاتورة",
  Customer: "عميل",
  Supplier: "مورد",
  Purchase: "مشتريات",
  Payment: "دفعة",
  Employee: "موظف",
  Expense: "مصروف",
  Return: "مرتجع",
  Voucher: "سند",
  Cashbox: "خزنة",
  BankAccount: "بنك",
  Warehouse: "مخزن",
  User: "مستخدم",
  Settings: "إعدادات",
  Auth: "تسجيل دخول",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== "ALL") params.set("action", actionFilter);
      if (entityFilter !== "ALL") params.set("entity", entityFilter);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      params.set("limit", "500");

      const res = await fetch(`/api/audit-log?${params.toString()}`);
      if (res.ok) setLogs(await res.json());
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
  }, [actionFilter, entityFilter]);

  const filtered = logs.filter((log) => {
    const term = search.toLowerCase();
    if (!term) return true;
    return (
      log.description?.toLowerCase().includes(term) ||
      log.userName?.toLowerCase().includes(term) ||
      log.userEmail?.toLowerCase().includes(term) ||
      log.entity.toLowerCase().includes(term)
    );
  });

  const exportCSV = () => {
    if (filtered.length === 0) {
      showError("لا توجد بيانات");
      return;
    }
    const headers = ["#", "الإجراء", "الكيان", "الوصف", "المستخدم", "الإيميل", "التاريخ"];
    const rows = filtered.map((log) =>
      [
        log.id,
        actionConfig[log.action]?.label || log.action,
        entityLabels[log.entity] || log.entity,
        log.description || "—",
        log.userName || "—",
        log.userEmail || "—",
        new Date(log.createdAt).toLocaleString("ar-EG"),
      ].join(",")
    );
    const blob = new Blob(["\uFEFF" + `${headers.join(",")}\n${rows.join("\n")}`], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    showSuccess("تم تصدير الملف");
  };

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-100">
              <FileText className="text-primary-600" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">سجل النشاط</h1>
              <p className="text-sm text-[var(--color-neutral-500)] mt-1">
                {filtered.length} سجل
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

        {/* Filters */}
        <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl shadow-sm border border-[var(--color-card-border)] mb-6 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">
                الإجراء
              </label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full border-2 border-[var(--color-card-border)] bg-[var(--color-card-bg)] text-[var(--color-fg)] p-3 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
              >
                <option value="ALL">الكل</option>
                <option value="CREATE">إضافة</option>
                <option value="UPDATE">تعديل</option>
                <option value="DELETE">حذف</option>
                <option value="LOGIN">دخول</option>
                <option value="LOGOUT">خروج</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5">
                الكيان
              </label>
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="w-full border-2 border-[var(--color-card-border)] bg-[var(--color-card-bg)] text-[var(--color-fg)] p-3 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
              >
                <option value="ALL">الكل</option>
                <option value="Product">منتج</option>
                <option value="Invoice">فاتورة</option>
                <option value="Customer">عميل</option>
                <option value="Supplier">مورد</option>
                <option value="Purchase">مشتريات</option>
                <option value="Payment">دفعة</option>
                <option value="Employee">موظف</option>
                <option value="Expense">مصروف</option>
                <option value="Voucher">سند</option>
                <option value="Auth">تسجيل دخول</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} /> من تاريخ
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full border-2 border-[var(--color-card-border)] bg-[var(--color-card-bg)] text-[var(--color-fg)] p-3 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} /> إلى تاريخ
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="flex-1 border-2 border-[var(--color-card-border)] bg-[var(--color-card-bg)] text-[var(--color-fg)] p-3 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
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
          <div className="relative mt-3">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]" size={16} />
            <input
              type="text"
              placeholder="ابحث بالوصف أو اسم المستخدم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-2 border-[var(--color-card-border)] bg-[var(--color-card-bg)] text-[var(--color-fg)] p-3 pr-10 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] overflow-x-auto animate-slide-up">
          <table className="w-full text-right">
            <thead className="bg-[var(--color-neutral-50)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
              <tr>
                <th className="p-4 font-bold">#</th>
                <th className="p-4 font-bold">الإجراء</th>
                <th className="p-4 font-bold">الكيان</th>
                <th className="p-4 font-bold">الوصف</th>
                <th className="p-4 font-bold">المستخدم</th>
                <th className="p-4 font-bold">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-card-border)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[var(--color-neutral-500)]">
                    جاري التحميل...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <FileText className="mx-auto text-[var(--color-neutral-300)] mb-3" size={48} />
                    <p className="text-[var(--color-neutral-500)]">لا توجد سجلات.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((log) => {
                  const config = actionConfig[log.action] || actionConfig.CREATE;
                  const Icon = config.Icon;
                  return (
                    <tr key={log.id} className="hover:bg-primary-50/30 transition-colors">
                      <td className="p-4 font-mono text-sm text-[var(--color-neutral-500)]">#{log.id}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 ${config.bg} ${config.color}`}>
                          <Icon size={12} /> {config.label}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-[var(--color-neutral-700)]">
                        {entityLabels[log.entity] || log.entity}
                      </td>
                      <td className="p-4 text-sm text-[var(--color-neutral-600)] max-w-xs truncate">
                        {log.description || "—"}
                      </td>
                      <td className="p-4 text-sm">
                        {log.userName ? (
                          <div>
                            <div className="font-bold text-[var(--color-fg)] flex items-center gap-1.5">
                              <User size={12} /> {log.userName}
                            </div>
                            <div className="text-xs text-[var(--color-neutral-500)]">
                              {log.userEmail}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[var(--color-neutral-400)]">—</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-[var(--color-neutral-500)]">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={12} />
                          {new Date(log.createdAt).toLocaleString("ar-EG")}
                        </span>
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