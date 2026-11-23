"use client";

import { useState, useEffect } from "react";
import Header from "../../../components/Header";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Package,
  Wallet,
  Banknote,
  Calendar,
  Search,
  Download,
} from "lucide-react";
import { showError, showSuccess } from "@/utils/alerts";

type ReportType = "withdrawals" | "advances" | "salaries";

type Employee = { id: number; name: string };

type Withdrawal = {
  id: number;
  quantity: number;
  unitName: string | null;
  factor: number;
  price: number;
  total: number;
  withdrawalDate: string;
  employee: { name: string };
  product: { name: string };
};

type Advance = {
  id: number;
  personType: string;
  personName: string | null;
  amount: number;
  paidAmount: number;
  advanceDate: string;
  dueDate: string | null;
  employee?: { name: string } | null;
};

type Salary = {
  id: number;
  salary: number;
  advancesDeducted: number;
  withdrawalsDeducted: number;
  netSalary: number;
  payDate: string;
  employee: { name: string };
};

export default function EmployeeReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>("salaries");
  const [data, setData] = useState<(Withdrawal | Advance | Salary)[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedEmployee !== "all") params.set("employeeId", selectedEmployee);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const [dataRes, empRes] = await Promise.all([
        fetch(`/api/employees/reports/${activeReport}?${params.toString()}`),
        fetch("/api/employees"),
      ]);
      if (dataRes.ok) setData(await dataRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
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
  }, [activeReport, selectedEmployee]);

  const total = data.reduce((sum, item) => {
    if (activeReport === "withdrawals") return sum + (item as Withdrawal).total;
    if (activeReport === "advances") return sum + (item as Advance).amount;
    return sum + (item as Salary).netSalary;
  }, 0);

  const exportToCSV = () => {
    if (data.length === 0) {
      showError("لا توجد بيانات");
      return;
    }
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) => Object.values(row).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + `${headers}\n${rows}`], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `employees-${activeReport}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    showSuccess("تم تصدير الملف");
  };

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 animate-slide-down">
          <div className="flex items-center gap-3">
            <Link href="/employees" className="text-[var(--color-neutral-500)] hover:text-primary-600 hover:bg-primary-50 transition-colors p-2 rounded-lg">
              <ArrowRight size={22} />
            </Link>
            <div className="p-3 rounded-xl bg-primary-100">
              <BarChart3 className="text-primary-600" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">تقارير الموظفين</h1>
              <p className="text-sm text-[var(--color-neutral-500)] mt-1">{data.length} سجل</p>
            </div>
          </div>
          <button
            onClick={exportToCSV}
            className="bg-success-400 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-success-500 active:scale-[0.97] transition-all shadow-sm shadow-success-200 text-sm"
          >
            <Download size={16} /> تصدير CSV
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 bg-[var(--color-card-bg)] p-1.5 rounded-xl border border-[var(--color-card-border)] w-fit animate-slide-up">
          <button
            onClick={() => setActiveReport("salaries")}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 text-sm ${
              activeReport === "salaries" ? "bg-primary-500 text-white" : "text-[var(--color-neutral-500)] hover:text-primary-600"
            }`}
          >
            <Banknote size={16} /> المرتبات
          </button>
          <button
            onClick={() => setActiveReport("advances")}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 text-sm ${
              activeReport === "advances" ? "bg-primary-500 text-white" : "text-[var(--color-neutral-500)] hover:text-primary-600"
            }`}
          >
            <Wallet size={16} /> السلفيات
          </button>
          <button
            onClick={() => setActiveReport("withdrawals")}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 text-sm ${
              activeReport === "withdrawals" ? "bg-primary-500 text-white" : "text-[var(--color-neutral-500)] hover:text-primary-600"
            }`}
          >
            <Package size={16} /> المسحوبات
          </button>
        </div>

        {/* Filters */}
        <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl shadow-sm border border-[var(--color-card-border)] mb-6 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
            >
              <option value="all">كل الموظفين</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
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
          <div className="mt-3 bg-info-500/10 p-3 rounded-xl text-center">
            <div className="text-xs text-[var(--color-neutral-500)]">الإجمالي</div>
            <div className="text-lg font-extrabold text-info-500">
              {total.toLocaleString("ar-EG")} ج.م
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] overflow-x-auto animate-slide-up">
          {loading ? (
            <div className="p-12 text-center text-[var(--color-neutral-500)]">جاري التحميل...</div>
          ) : data.length === 0 ? (
            <div className="p-12 text-center">
              <BarChart3 className="mx-auto text-neutral-300 mb-3" size={48} />
              <p className="text-[var(--color-neutral-500)]">لا توجد بيانات.</p>
            </div>
          ) : (
            <>
              {activeReport === "withdrawals" && (
                <table className="w-full text-right">
                  <thead className="bg-[var(--color-bg)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
                    <tr>
                      <th className="p-4 font-bold">الموظف</th>
                      <th className="p-4 font-bold">المنتج</th>
                      <th className="p-4 font-bold">الكمية</th>
                      <th className="p-4 font-bold">السعر</th>
                      <th className="p-4 font-bold">الإجمالي</th>
                      <th className="p-4 font-bold">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {(data as Withdrawal[]).map((w) => (
                      <tr key={w.id} className="hover:bg-primary-50/30">
                        <td className="p-4 font-bold text-[var(--color-fg)]">{w.employee.name}</td>
                        <td className="p-4 text-[var(--color-neutral-700)]">{w.product.name}</td>
                        <td className="p-4 font-bold">{w.quantity} {w.unitName || ""}</td>
                        <td className="p-4 text-sm">{w.price.toLocaleString("ar-EG")} ج.م</td>
                        <td className="p-4 font-bold text-primary-600">{w.total.toLocaleString("ar-EG")} ج.م</td>
                        <td className="p-4 text-sm text-[var(--color-neutral-500)]">
                          {new Date(w.withdrawalDate).toLocaleDateString("ar-EG")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeReport === "advances" && (
                <table className="w-full text-right">
                  <thead className="bg-[var(--color-bg)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
                    <tr>
                      <th className="p-4 font-bold">النوع</th>
                      <th className="p-4 font-bold">الاسم</th>
                      <th className="p-4 font-bold">المبلغ</th>
                      <th className="p-4 font-bold">المدفوع</th>
                      <th className="p-4 font-bold">المتبقي</th>
                      <th className="p-4 font-bold">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {(data as Advance[]).map((a) => (
                      <tr key={a.id} className="hover:bg-primary-50/30">
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${a.personType === "EMPLOYEE" ? "bg-primary-100 text-primary-700" : "bg-info-500/10 text-info-500"}`}>
                            {a.personType === "EMPLOYEE" ? "موظف" : "شخص"}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-[var(--color-fg)]">{a.employee?.name || a.personName || "—"}</td>
                        <td className="p-4 font-bold">{a.amount.toLocaleString("ar-EG")} ج.م</td>
                        <td className="p-4 text-success-600 font-bold">{a.paidAmount.toLocaleString("ar-EG")} ج.م</td>
                        <td className="p-4 text-danger-600 font-bold">
                          {(a.amount - a.paidAmount).toLocaleString("ar-EG")} ج.م
                        </td>
                        <td className="p-4 text-sm text-[var(--color-neutral-500)]">
                          {new Date(a.advanceDate).toLocaleDateString("ar-EG")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeReport === "salaries" && (
                <table className="w-full text-right">
                  <thead className="bg-[var(--color-bg)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
                    <tr>
                      <th className="p-4 font-bold">الموظف</th>
                      <th className="p-4 font-bold">الراتب</th>
                      <th className="p-4 font-bold">خصم السلف</th>
                      <th className="p-4 font-bold">خصم المسحوبات</th>
                      <th className="p-4 font-bold">الصافي</th>
                      <th className="p-4 font-bold">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {(data as Salary[]).map((s) => (
                      <tr key={s.id} className="hover:bg-primary-50/30">
                        <td className="p-4 font-bold text-[var(--color-fg)]">{s.employee.name}</td>
                        <td className="p-4 text-sm text-[var(--color-neutral-700)]">{s.salary.toLocaleString("ar-EG")} ج.م</td>
                        <td className="p-4 text-sm text-danger-600">
                          {s.advancesDeducted > 0 ? `-${s.advancesDeducted.toLocaleString("ar-EG")}` : "—"}
                        </td>
                        <td className="p-4 text-sm text-danger-600">
                          {s.withdrawalsDeducted > 0 ? `-${s.withdrawalsDeducted.toLocaleString("ar-EG")}` : "—"}
                        </td>
                        <td className="p-4 font-bold text-success-600">{s.netSalary.toLocaleString("ar-EG")} ج.م</td>
                        <td className="p-4 text-sm text-[var(--color-neutral-500)]">
                          {new Date(s.payDate).toLocaleDateString("ar-EG")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}