"use client";

import { useState, useEffect, useRef } from "react";
import Header from "../../../components/Header";
import {
  Printer,
  Package,
  Users,
  Truck,
  ReceiptText,
  ShoppingBag,
  UserGroup,
  UserCircle,
  FileSpreadsheet,
  Warehouse,
  Store,
  ClipboardList,
  RotateCcw,
  AlertTriangle,
  Wallet,
  Ruler,
  Tags,
  Layers,
} from "lucide-react";
import { showError, showSuccess } from "@/utils/alerts";
import * as XLSX from "xlsx";

type ReportType =
  | "products"
  | "categories"
  | "units"
  | "warehouses"
  | "branches"
  | "inventory"
  | "transfers"
  | "damaged"
  | "customers"
  | "suppliers"
  | "invoices"
  | "purchases"
  | "returns"
  | "expenses"
  | "employees"
  | "users";

type ReportData = Record<string, unknown>;

export default function AllReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>("products");
  const [data, setData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const reports = [
    { id: "products", name: "المنتجات", icon: Package, endpoint: "/api/products" },
    { id: "categories", name: "الأقسام", icon: Tags, endpoint: "/api/categories" },
    { id: "units", name: "الوحدات", icon: Ruler, endpoint: "/api/units" },
    { id: "warehouses", name: "المخازن", icon: Warehouse, endpoint: "/api/warehouses" },
    { id: "branches", name: "الفروع", icon: Store, endpoint: "/api/branches" },
    { id: "inventory", name: "جرد المخازن", icon: ClipboardList, endpoint: "/api/warehouses/inventory" },
    { id: "transfers", name: "التحويلات", icon: Layers, endpoint: "/api/warehouses/transfer" },
    { id: "damaged", name: "التالف", icon: AlertTriangle, endpoint: "/api/warehouses/damaged" },
    { id: "customers", name: "العملاء", icon: Users, endpoint: "/api/customers" },
    { id: "suppliers", name: "الموردين", icon: Truck, endpoint: "/api/suppliers" },
    { id: "invoices", name: "الفواتير", icon: ReceiptText, endpoint: "/api/invoices" },
    { id: "purchases", name: "المشتريات", icon: ShoppingBag, endpoint: "/api/purchases" },
    { id: "returns", name: "المرتجعات", icon: RotateCcw, endpoint: "/api/returns" },
    { id: "expenses", name: "المصروفات", icon: Wallet, endpoint: "/api/expenses" },
    { id: "employees", name: "الموظفين", icon: UserGroup, endpoint: "/api/employees" },
    { id: "users", name: "المستخدمين", icon: UserCircle, endpoint: "/api/users" },
  ];

  const fetchReport = async (endpoint: string) => {
    setLoading(true);
    try {
      const res = await fetch(endpoint);
      if (res.ok) {
        const json = await res.json();
        setData(Array.isArray(json) ? json : json.data && Array.isArray(json.data) ? json.data : []);
      } else {
        setData([]);
      }
    } catch {
      showError("حدث خطأ في جلب البيانات");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const report = reports.find((r) => r.id === activeReport);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (report) fetchReport(report.endpoint);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReport]);

  const handlePrint = () => window.print();

  const exportToExcel = () => {
    if (data.length === 0) {
      showError("لا توجد بيانات للتصدير");
      return;
    }
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
      const fileName = `تقرير_${reports.find((r) => r.id === activeReport)?.name}_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      showSuccess("تم تصدير التقرير بنجاح");
    } catch {
      showError("حدث خطأ أثناء التصدير");
    }
  };

  const formatDate = (val: unknown) => {
    if (!val) return "—";
    try {
      return new Date(String(val)).toLocaleString("ar-EG");
    } catch {
      return String(val);
    }
  };

  const renderTable = () => {
    if (data.length === 0) {
      return <p className="text-center text-[var(--color-neutral-500)] py-8">لا توجد بيانات في هذا التقرير.</p>;
    }

    const thClass = "p-3 font-bold text-[var(--color-neutral-700)] bg-[var(--color-bg)] text-sm";
    const tdClass = "p-3 text-sm text-[var(--color-neutral-700)] border-b border-[var(--color-card-border)]";

    switch (activeReport) {
      case "products":
        return (
          <table className="w-full text-right">
            <thead>
              <tr>
                <th className={thClass}>الاسم</th>
                <th className={thClass}>الباركود</th>
                <th className={thClass}>السعر</th>
                <th className={thClass}>المخزون</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={String(item.id)} className="hover:bg-primary-50/30">
                  <td className={`${tdClass} font-bold`}>{String(item.name)}</td>
                  <td className={tdClass}>{item.barcode ? String(item.barcode) : "—"}</td>
                  <td className={tdClass}>{String(item.sellPrice)} ج.م</td>
                  <td className={tdClass}>{String(item.stock)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "categories":
        return (
          <table className="w-full text-right">
            <thead>
              <tr>
                <th className={thClass}>#</th>
                <th className={thClass}>اسم القسم</th>
                <th className={thClass}>تاريخ الإضافة</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={String(item.id)} className="hover:bg-primary-50/30">
                  <td className={tdClass}>{idx + 1}</td>
                  <td className={`${tdClass} font-bold`}>{String(item.name)}</td>
                  <td className={tdClass}>{formatDate(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "units":
        return (
          <table className="w-full text-right">
            <thead>
              <tr>
                <th className={thClass}>#</th>
                <th className={thClass}>اسم الوحدة</th>
                <th className={thClass}>تاريخ الإضافة</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={String(item.id)} className="hover:bg-primary-50/30">
                  <td className={tdClass}>{idx + 1}</td>
                  <td className={`${tdClass} font-bold`}>{String(item.name)}</td>
                  <td className={tdClass}>{formatDate(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "warehouses":
        return (
          <table className="w-full text-right">
            <thead>
              <tr>
                <th className={thClass}>الاسم</th>
                <th className={thClass}>الفرع</th>
                <th className={thClass}>الحالة</th>
                <th className={thClass}>تاريخ الإضافة</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => {
                const branch = item.branch as { name?: string } | null;
                return (
                  <tr key={String(item.id)} className="hover:bg-primary-50/30">
                    <td className={`${tdClass} font-bold`}>{String(item.name)}</td>
                    <td className={tdClass}>{branch?.name || "—"}</td>
                    <td className={tdClass}>{item.isActive ? "نشط" : "غير نشط"}</td>
                    <td className={tdClass}>{formatDate(item.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        );

      case "branches":
        return (
          <table className="w-full text-right">
            <thead>
              <tr>
                <th className={thClass}>الاسم</th>
                <th className={thClass}>العنوان</th>
                <th className={thClass}>التليفون</th>
                <th className={thClass}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={String(item.id)} className="hover:bg-primary-50/30">
                  <td className={`${tdClass} font-bold`}>{String(item.name)}</td>
                  <td className={tdClass}>{item.address ? String(item.address) : "—"}</td>
                  <td className={tdClass}>{item.phone ? String(item.phone) : "—"}</td>
                  <td className={tdClass}>{item.isActive ? "نشط" : "غير نشط"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "inventory":
        return (
          <table className="w-full text-right">
            <thead>
              <tr>
                <th className={thClass}>المنتج</th>
                <th className={thClass}>المخزن</th>
                <th className={thClass}>الكمية</th>
                <th className={thClass}>سعر الشراء</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => {
                const product = item.product as { name?: string } | null;
                const warehouse = item.warehouse as { name?: string } | null;
                return (
                  <tr key={String(item.id)} className="hover:bg-primary-50/30">
                    <td className={`${tdClass} font-bold`}>{product?.name || "—"}</td>
                    <td className={tdClass}>{warehouse?.name || "—"}</td>
                    <td className={tdClass}>{String(item.stock)}</td>
                    <td className={tdClass}>{String(item.purchasePrice || 0)} ج.م</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        );

      case "transfers":
        return (
          <table className="w-full text-right">
            <thead>
              <tr>
                <th className={thClass}>المنتج</th>
                <th className={thClass}>من</th>
                <th className={thClass}>إلى</th>
                <th className={thClass}>الكمية</th>
                <th className={thClass}>التاريخ</th>
                <th className={thClass}>المسؤول</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => {
                const product = item.product as { name?: string } | null;
                const from = item.fromWarehouse as { name?: string } | null;
                const to = item.toWarehouse as { name?: string } | null;
                return (
                  <tr key={String(item.id)} className="hover:bg-primary-50/30">
                    <td className={`${tdClass} font-bold`}>{product?.name || "—"}</td>
                    <td className={tdClass}>{from?.name || "—"}</td>
                    <td className={tdClass}>{to?.name || "—"}</td>
                    <td className={tdClass}>{String(item.quantity)} {item.unitName ? String(item.unitName) : ""}</td>
                    <td className={tdClass}>{formatDate(item.transferDate)}</td>
                    <td className={tdClass}>{item.responsible ? String(item.responsible) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        );

      case "damaged":
        return (
          <table className="w-full text-right">
            <thead>
              <tr>
                <th className={thClass}>المنتج</th>
                <th className={thClass}>المخزن</th>
                <th className={thClass}>الكمية</th>
                <th className={thClass}>السبب</th>
                <th className={thClass}>التاريخ</th>
                <th className={thClass}>المسؤول</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => {
                const product = item.product as { name?: string } | null;
                const warehouse = item.warehouse as { name?: string } | null;
                return (
                  <tr key={String(item.id)} className="hover:bg-primary-50/30">
                    <td className={`${tdClass} font-bold`}>{product?.name || "—"}</td>
                    <td className={tdClass}>{warehouse?.name || "—"}</td>
                    <td className={tdClass}>{String(item.quantity)}</td>
                    <td className={tdClass}>{item.reason ? String(item.reason) : "—"}</td>
                    <td className={tdClass}>{formatDate(item.damageDate)}</td>
                    <td className={tdClass}>{item.responsible ? String(item.responsible) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        );

      case "customers":
        return (
          <table className="w-full text-right">
            <thead>
              <tr>
                <th className={thClass}>الاسم</th>
                <th className={thClass}>التليفون</th>
                <th className={thClass}>الإيميل</th>
                <th className={thClass}>تاريخ التسجيل</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={String(item.id)} className="hover:bg-primary-50/30">
                  <td className={`${tdClass} font-bold`}>{String(item.name)}</td>
                  <td className={tdClass}>{String(item.phone)}</td>
                  <td className={tdClass}>{item.email ? String(item.email) : "—"}</td>
                  <td className={tdClass}>{formatDate(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "suppliers":
        return (
          <table className="w-full text-right">
            <thead>
              <tr>
                <th className={thClass}>الاسم</th>
                <th className={thClass}>التليفون</th>
                <th className={thClass}>الإيميل</th>
                <th className={thClass}>تاريخ الإضافة</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={String(item.id)} className="hover:bg-primary-50/30">
                  <td className={`${tdClass} font-bold`}>{String(item.name)}</td>
                  <td className={tdClass}>{String(item.phone)}</td>
                  <td className={tdClass}>{item.email ? String(item.email) : "—"}</td>
                  <td className={tdClass}>{formatDate(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "invoices":
        return (
          <table className="w-full text-right">
            <thead>
              <tr>
                <th className={thClass}>رقم الفاتورة</th>
                <th className={thClass}>التاريخ</th>
                <th className={thClass}>الإجمالي</th>
                <th className={thClass}>طريقة الدفع</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={String(item.id)} className="hover:bg-primary-50/30">
                  <td className={`${tdClass} font-mono font-bold text-primary-600`}>#{String(item.id)}</td>
                  <td className={tdClass}>{formatDate(item.createdAt)}</td>
                  <td className={`${tdClass} font-bold text-success-600`}>{String(item.total)} ج.م</td>
                  <td className={tdClass}>{item.paymentMethod === "CARD" ? "فيزا" : "نقدي"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "purchases":
        return (
          <table className="w-full text-right">
            <thead>
              <tr>
                <th className={thClass}>رقم الطلب</th>
                <th className={thClass}>التاريخ</th>
                <th className={thClass}>الإجمالي</th>
                <th className={thClass}>الحالة</th>
                <th className={thClass}>طريقة الدفع</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={String(item.id)} className="hover:bg-primary-50/30">
                  <td className={`${tdClass} font-mono font-bold text-primary-600`}>#{String(item.id)}</td>
                  <td className={tdClass}>{formatDate(item.createdAt)}</td>
                  <td className={`${tdClass} font-bold`}>{String(item.total)} ج.م</td>
                  <td className={tdClass}>
                    {item.status === "PENDING" ? "معلق" : item.status === "RECEIVED" ? "تم الاستلام" : String(item.status)}
                  </td>
                  <td className={tdClass}>{item.paymentMethod === "CREDIT" ? "آجل" : "كاش"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "returns":
        return (
          <table className="w-full text-right">
            <thead>
              <tr>
                <th className={thClass}>رقم الفاتورة</th>
                <th className={thClass}>التاريخ</th>
                <th className={thClass}>الإجمالي</th>
                <th className={thClass}>السبب</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={String(item.id)} className="hover:bg-primary-50/30">
                  <td className={`${tdClass} font-mono font-bold text-primary-600`}>#{String(item.invoiceId)}</td>
                  <td className={tdClass}>{formatDate(item.createdAt)}</td>
                  <td className={`${tdClass} font-bold text-orange-600`}>{String(item.total)} ج.م</td>
                  <td className={tdClass}>{item.reason ? String(item.reason) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "expenses":
        return (
          <table className="w-full text-right">
            <thead>
              <tr>
                <th className={thClass}>اسم المصروف</th>
                <th className={thClass}>المبلغ</th>
                <th className={thClass}>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={String(item.id)} className="hover:bg-primary-50/30">
                  <td className={`${tdClass} font-bold`}>{String(item.title)}</td>
                  <td className={`${tdClass} font-bold text-danger-600`}>{String(item.amount)} ج.م</td>
                  <td className={tdClass}>{formatDate(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "employees":
        return (
          <table className="w-full text-right">
            <thead>
              <tr>
                <th className={thClass}>الاسم</th>
                <th className={thClass}>الوظيفة</th>
                <th className={thClass}>الراتب</th>
                <th className={thClass}>التليفون</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={String(item.id)} className="hover:bg-primary-50/30">
                  <td className={`${tdClass} font-bold`}>{String(item.name)}</td>
                  <td className={tdClass}>{String(item.position)}</td>
                  <td className={`${tdClass} font-bold text-success-600`}>{String(item.salary)} ج.م</td>
                  <td className={tdClass}>{String(item.phone)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case "users":
        return (
          <table className="w-full text-right">
            <thead>
              <tr>
                <th className={thClass}>الاسم</th>
                <th className={thClass}>الإيميل</th>
                <th className={thClass}>الدور</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={String(item.id)} className="hover:bg-primary-50/30">
                  <td className={`${tdClass} font-bold`}>{item.name ? String(item.name) : "—"}</td>
                  <td className={tdClass} dir="ltr">{String(item.email)}</td>
                  <td className={tdClass}>
                    {item.role === "ADMIN" ? "مدير" : item.role === "ACCOUNTANT" ? "محاسب" : "كاشير"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { width: 100%; padding: 0; box-shadow: none; border: none; }
          body { background: white; }
          .report-tabs { display: none; }
        }
      `}</style>

      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 no-print animate-slide-down">
          <div className="p-3 rounded-xl bg-primary-100">
            <ReceiptText className="text-primary-600" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">التقارير الشاملة</h1>
            <p className="text-sm text-[var(--color-neutral-500)] mt-1">{reports.length} تقرير متاح</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 no-print report-tabs animate-slide-up">
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id as ReportType)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all text-sm ${
                activeReport === report.id
                  ? "bg-primary-500 text-white shadow-sm shadow-primary-200"
                  : "bg-[var(--color-card-bg)] text-[var(--color-neutral-600)] hover:bg-primary-50 hover:text-primary-600 border border-[var(--color-neutral-200)]"
              }`}
            >
              <report.icon size={16} />
              {report.name}
            </button>
          ))}
        </div>

        {/* Report Content */}
        <div ref={printRef} className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] print-area animate-slide-up">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <h2 className="text-xl font-extrabold text-[var(--color-fg)]">
              تقرير {reports.find((r) => r.id === activeReport)?.name}
              <span className="text-sm font-normal text-[var(--color-neutral-500)] mr-2">({data.length} سجل)</span>
            </h2>
            <div className="flex gap-2">
              <button
                onClick={exportToExcel}
                className="bg-success-400 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-success-500 active:scale-[0.97] transition-all no-print text-sm shadow-sm shadow-success-200"
              >
                <FileSpreadsheet size={16} /> تصدير Excel
              </button>
              <button
                onClick={handlePrint}
                className="bg-info-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 active:scale-[0.97] transition-all no-print text-sm shadow-sm"
              >
                <Printer size={16} /> طباعة
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-pulse-soft">
                  <Package className="text-primary-500 mx-auto mb-3" size={40} />
                  <p className="text-[var(--color-neutral-500)] font-bold text-sm">جاري التحميل...</p>
                </div>
              </div>
            ) : (
              renderTable()
            )}
          </div>
        </div>
      </main>
    </>
  );
}