"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, Home } from "lucide-react";

const pathLabels: Record<string, string> = {
  admin: "لوحة التحكم",
  dashboard: "لوحة التحكم",
  pos: "الكاشير",
  products: "المنتجات",
  add: "إضافة",
  edit: "تعديل",
  barcode: "باركود",
  warehouses: "المخازن",
  inventory: "جرد",
  transfer: "تحويل",
  damaged: "تالف",
  invoices: "الفواتير",
  create: "جديدة",
  purchases: "المشتريات",
  log: "سجل",
  manage: "إدارة",
  suppliers: "الموردين",
  payments: "مدفوعات",
  accounts: "حسابات",
  customers: "العملاء",
  employees: "الموظفين",
  withdrawals: "مسحوبات",
  advances: "سلفيات",
  salaries: "مرتبات",
  reports: "التقارير",
  "returns-log": "سجل المرتجعات",
  returns: "المرتجعات",
  treasury: "الخزنة",
  deposit: "إيداع",
  withdraw: "سحب",
  vouchers: "السندات",
  receipt: "قبض",
  payment: "صرف",
  expenses: "المصروفات",
  tax: "الإقرار الضريبي",
  settings: "الإعدادات",
  printers: "الطابعات",
  categories: "الأقسام",
  users: "المستخدمين",
  orders: "الطلبات",
  notifications: "الإشعارات",
  backup: "النسخ الاحتياطي",
  audit: "جرد",
  audits: "جلسات الجرد",
  hr: "الموارد البشرية",
  branches: "الفروع",
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // إخفاء في صفحة Login و Dashboard
  if (segments.length === 0) return null;
  if (pathname?.startsWith("/login")) return null;
  if (pathname === "/admin/dashboard") return null;

  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = pathLabels[segment] || (/^\d+$/.test(segment) ? `#${segment}` : segment);
    const isLast = index === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav className="max-w-7xl mx-auto px-4 pt-4 pb-2 animate-fade-in no-print">
      <ol className="flex items-center flex-wrap gap-1.5 text-sm">
        <li>
          <Link
            href="/admin/dashboard"
            className="text-[var(--color-neutral-400)] hover:text-primary-600 transition-colors p-1 rounded"
            title="الرئيسية"
          >
            <Home size={14} />
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            <ChevronLeft size={14} className="text-neutral-300" />
            {crumb.isLast ? (
              <span className="text-primary-600 font-bold">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-[var(--color-neutral-500)] hover:text-primary-600 transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}