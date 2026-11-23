"use client";

import { useState, useEffect } from "react";
import Header from "../../../components/Header";
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Wallet,
  Download,
  DollarSign,
  Package,
  AlertCircle,
} from "lucide-react";
import { showError, showSuccess } from "@/utils/alerts";

type Product = {
  id: number;
  name: string;
  stock: number;
  sellPrice: number;
};

type Invoice = {
  id: number;
  items: { productId: number | null; quantity: number }[];
  total: number;
};

type Expense = {
  id: number;
  title: string;
  amount: number;
  createdAt: string;
};

export default function AdvancedReportsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, invRes, expRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/invoices"),
          fetch("/api/expenses"),
        ]);
        if (prodRes.ok) setProducts(await prodRes.json());
        if (invRes.ok) setInvoices(await invRes.json());
        if (expRes.ok) setExpenses(await expRes.json());
      } catch {
        showError("حدث خطأ في جلب البيانات");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const productSales: Record<number, number> = {};
  invoices.forEach((inv) => {
    inv.items?.forEach((item) => {
      if (item.productId !== null) {
        productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
      }
    });
  });

  const slowMoving = products.filter((p) => (productSales[p.id] || 0) < 5);
  const topSelling = [...products]
    .map((p) => ({ ...p, sold: productSales[p.id] || 0 }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  const totalSales = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = totalSales - totalExpenses;

  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) {
      showError("لا توجد بيانات للتصدير");
      return;
    }
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) => Object.values(row).join(",")).join("\n");
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    showSuccess("تم تصدير الملف بنجاح");
  };

  if (loading)
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-pulse-soft">
          <BarChart3 className="text-primary-500 mx-auto mb-4" size={48} />
          <p className="text-[var(--color-neutral-500)] font-bold">جاري التحميل...</p>
        </div>
      </div>
    );

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 animate-slide-down">
          <div className="p-3 rounded-xl bg-primary-100">
            <BarChart3 className="text-primary-600" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">التقارير المتقدمة</h1>
            <p className="text-sm text-[var(--color-neutral-500)] mt-1">تحليل شامل للمبيعات والمصروفات</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 stagger-children">
          <div className="bg-[var(--color-card-bg)] p-5 rounded-2xl border border-[var(--color-card-border)] flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-success-100">
              <TrendingUp className="text-success-600" size={22} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-neutral-500)] mb-0.5">إجمالي المبيعات</div>
              <div className="text-2xl font-extrabold text-success-600">
                {totalSales.toLocaleString("ar-EG")} ج.م
              </div>
            </div>
          </div>
          <div className="bg-[var(--color-card-bg)] p-5 rounded-2xl border border-[var(--color-card-border)] flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-danger-50">
              <Wallet className="text-danger-500" size={22} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-neutral-500)] mb-0.5">إجمالي المصروفات</div>
              <div className="text-2xl font-extrabold text-danger-600">
                {totalExpenses.toLocaleString("ar-EG")} ج.م
              </div>
            </div>
          </div>
          <div className="bg-[var(--color-card-bg)] p-5 rounded-2xl border border-[var(--color-card-border)] flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className={`p-3 rounded-xl ${netProfit >= 0 ? "bg-success-100" : "bg-danger-50"}`}>
              <DollarSign className={netProfit >= 0 ? "text-success-600" : "text-danger-500"} size={22} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-neutral-500)] mb-0.5">صافي الربح</div>
              <div className={`text-2xl font-extrabold ${netProfit >= 0 ? "text-success-600" : "text-danger-600"}`}>
                {netProfit.toLocaleString("ar-EG")} ج.م
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling */}
        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] mb-6 animate-slide-up">
          <div className="p-4 border-b border-[var(--color-card-border)]">
            <h2 className="text-lg font-extrabold text-[var(--color-fg)] flex items-center gap-2">
              <TrendingUp className="text-success-500" size={20} /> المنتجات الأكثر مبيعاً
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-[var(--color-bg)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
                <tr>
                  <th className="p-4 font-bold">#</th>
                  <th className="p-4 font-bold">اسم المنتج</th>
                  <th className="p-4 font-bold">المبيعات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {topSelling.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-[var(--color-neutral-500)]">
                      لا توجد بيانات.
                    </td>
                  </tr>
                ) : (
                  topSelling.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-primary-50/30 transition-colors">
                      <td className="p-4">
                        <span className="w-7 h-7 inline-flex items-center justify-center rounded-full bg-success-100 text-success-700 text-xs font-bold">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-[var(--color-fg)]">{p.name}</td>
                      <td className="p-4">
                        <span className="bg-success-100 text-success-700 px-3 py-1 rounded-lg text-xs font-bold">
                          {p.sold} قطعة
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Slow Moving */}
        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] mb-6 animate-slide-up">
          <div className="p-4 border-b border-[var(--color-card-border)] flex justify-between items-center flex-wrap gap-3">
            <h2 className="text-lg font-extrabold text-[var(--color-fg)] flex items-center gap-2">
              <TrendingDown className="text-orange-500" size={20} /> المنتجات الراكدة
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-bold">
                {slowMoving.length}
              </span>
            </h2>
            <button
              onClick={() => exportToCSV(slowMoving, "slow-moving-products")}
              className="bg-success-400 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-success-500 active:scale-[0.97] transition-all shadow-sm shadow-success-200 font-bold"
            >
              <Download size={14} /> تصدير
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-[var(--color-bg)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
                <tr>
                  <th className="p-4 font-bold">اسم المنتج</th>
                  <th className="p-4 font-bold">الكمية المتبقية</th>
                  <th className="p-4 font-bold">المبيعات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {slowMoving.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center">
                      <AlertCircle className="mx-auto text-success-400 mb-2" size={40} />
                      <p className="text-success-600 font-bold">لا توجد منتجات راكدة ✅</p>
                    </td>
                  </tr>
                ) : (
                  slowMoving.map((p) => (
                    <tr key={p.id} className="hover:bg-primary-50/30 transition-colors">
                      <td className="p-4 font-bold text-[var(--color-fg)]">{p.name}</td>
                      <td className="p-4 text-[var(--color-neutral-600)]">{p.stock}</td>
                      <td className="p-4">
                        <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                          {productSales[p.id] || 0} قطعة
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] animate-slide-up">
          <div className="p-4 border-b border-[var(--color-card-border)] flex justify-between items-center flex-wrap gap-3">
            <h2 className="text-lg font-extrabold text-[var(--color-fg)] flex items-center gap-2">
              <Wallet className="text-danger-500" size={20} /> تقرير المصروفات
              <span className="text-xs bg-danger-50 text-danger-700 px-2 py-0.5 rounded font-bold">
                {expenses.length}
              </span>
            </h2>
            <button
              onClick={() => exportToCSV(expenses, "expenses-report")}
              className="bg-success-400 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-success-500 active:scale-[0.97] transition-all shadow-sm shadow-success-200 font-bold"
            >
              <Download size={14} /> تصدير
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-[var(--color-bg)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
                <tr>
                  <th className="p-4 font-bold">اسم المصروف</th>
                  <th className="p-4 font-bold">المبلغ</th>
                  <th className="p-4 font-bold">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-[var(--color-neutral-500)]">
                      لا توجد مصروفات مسجلة.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-primary-50/30 transition-colors">
                      <td className="p-4 font-bold text-[var(--color-fg)]">{exp.title}</td>
                      <td className="p-4 font-bold text-danger-600">
                        {exp.amount.toLocaleString("ar-EG")} ج.م
                      </td>
                      <td className="p-4 text-sm text-[var(--color-neutral-500)]">
                        {new Date(exp.createdAt).toLocaleDateString("ar-EG")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}