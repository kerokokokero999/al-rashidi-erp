"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Users, Truck, ReceiptText, ShoppingBag,
  UserGroup, UserCircle, Wallet, FileClock, BarChart3,
  Tags, Package, ShoppingCart, UserCheck,
  ClipboardList, Store, RotateCcw, LayoutDashboard,
  Settings, Bell, Database,
  TrendingUp,
  TrendingDown,
  Eye,
  ArrowLeftRight,
  Banknote,
  FileText,
  Printer,
  HelpCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Session } from "next-auth";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  permission?: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: session } = useSession();
  const userRole = (session as Session & { user: { role?: string } })?.user?.role;

  let permissions: string[] = [];
  if (userRole === "ADMIN") {
    permissions = [
  "/admin", "/pos", "/products", "/invoices", "/purchases",
  "/suppliers", "/customers", "/employees", "/expenses",
  "/reports", "/returns", "/returns-log", "/settings", "/users",
  "/orders", "/hr", "/audits", "/branches", "/notifications",
  "/backup", "/warehouses", "/treasury", "/vouchers", "/tax",
  "/audit-log", "/help",
];
  } else {
    try {
      permissions = JSON.parse((session as Session & { user: { permissions?: string } })?.user?.permissions || "[]");
    } catch {
      permissions = [];
    }
  }

  const hasPermission = (path?: string) => {
    if (!path) return true;
    return permissions.some((perm) => path.startsWith(perm));
  };

  const sections: NavSection[] = [
    {
      title: "الرئيسية",
      items: [
        { href: "/admin/dashboard", label: "لوحة التحكم", icon: LayoutDashboard, permission: "/admin" },
        { href: "/pos", label: "الكاشير", icon: ShoppingCart },
        { href: "/notifications", label: "الإشعارات", icon: Bell, permission: "/notifications" },
      ],
    },
    {
      title: "المبيعات",
      items: [
        { href: "/invoices", label: "الفواتير", icon: ReceiptText, permission: "/invoices" },
        { href: "/returns", label: "المرتجعات", icon: RotateCcw, permission: "/returns" },
        { href: "/returns-log", label: "سجل المرتجعات", icon: RotateCcw, permission: "/returns-log" },
        { href: "/orders", label: "الطلبات", icon: ShoppingBag, permission: "/orders" },
      ],
    },
    {
      title: "المخزون والمشتريات",
      items: [
        { href: "/products", label: "المنتجات", icon: Package },
        { href: "/warehouses", label: "المخازن", icon: Store, permission: "/warehouses" },
        { href: "/warehouses/inventory", label: "جرد المخازن", icon: ClipboardList, permission: "/warehouses" },
        { href: "/warehouses/transfer", label: "تحويل بين المخازن", icon: RotateCcw, permission: "/warehouses" },
        { href: "/warehouses/damaged", label: "المنتجات التالفة", icon: Package, permission: "/warehouses" },
        { href: "/suppliers", label: "الموردين", icon: Truck, permission: "/suppliers" },
        { href: "/purchases", label: "المشتريات", icon: ShoppingBag, permission: "/purchases" },
        { href: "/purchases/log", label: "سجل المشتريات", icon: FileClock, permission: "/purchases" },
        { href: "/purchases/manage", label: "طلبات الشراء المعلقة", icon: FileClock, permission: "/purchases" },
        { href: "/audits", label: "جلسات الجرد", icon: ClipboardList, permission: "/audits" },
      ],
    },
    {
  title: "الخزنة والبنك",
  items: [
    { href: "/treasury", label: "الخزنة والبنك", icon: Wallet, permission: "/treasury" },
    { href: "/treasury/deposit", label: "إيداع", icon: TrendingUp, permission: "/treasury" },
    { href: "/treasury/withdraw", label: "سحب", icon: TrendingDown, permission: "/treasury" },
    { href: "/treasury/transfer", label: "تحويل", icon: ArrowLeftRight, permission: "/treasury" },
    { href: "/treasury/report", label: "تقرير الحركات", icon: Eye, permission: "/treasury" },
    { href: "/treasury/reports", label: "تقارير الخزنة", icon: FileText, permission: "/treasury" },
  ],
},
{
  title: "السندات",
  items: [
    { href: "/vouchers/receipt", label: "سند قبض", icon: TrendingUp, permission: "/vouchers" },
    { href: "/vouchers/payment", label: "سند صرف", icon: TrendingDown, permission: "/vouchers" },
    { href: "/vouchers/report", label: "تقرير السندات", icon: ReceiptText, permission: "/vouchers" },
  ],
},
    {
      title: "العملاء والموظفين",
      items: [
        { href: "/customers", label: "العملاء", icon: Users, permission: "/customers" },
        { href: "/customers/accounts", label: "حسابات العملاء", icon: Wallet, permission: "/customers" },
        { href: "/customers/payments", label: "تقرير مدفوعات العملاء", icon: Wallet, permission: "/customers" },
        { href: "/employees", label: "الموظفين", icon: UserGroup, permission: "/employees" },
        { href: "/employees/withdrawals", label: "مسحوبات الموظفين", icon: Package, permission: "/employees" },
        { href: "/employees/advances", label: "السلفيات", icon: Wallet, permission: "/employees" },
        { href: "/employees/salaries", label: "صرف المرتبات", icon: Banknote, permission: "/employees" },
        { href: "/employees/reports", label: "تقارير الموظفين", icon: BarChart3, permission: "/employees" },
        { href: "/hr", label: "الموارد البشرية", icon: UserCheck, permission: "/hr" },
        { href: "/users", label: "المستخدمين", icon: UserCircle, permission: "/users" },
        { href: "/suppliers/accounts", label: "حسابات الموردين", icon: Wallet, permission: "/suppliers" },
        { href: "/suppliers/payments", label: "تقرير مدفوعات الموردين", icon: Wallet, permission: "/suppliers" },
      ],
    },
    {
      title: "التقارير",
      items: [
        { href: "/reports", label: "تقارير المبيعات", icon: BarChart3, permission: "/reports" },
        { href: "/reports/advanced", label: "التقارير المتقدمة", icon: BarChart3, permission: "/reports" },
        { href: "/reports/all", label: "التقارير الشاملة", icon: BarChart3, permission: "/reports" },
      ],
    },
    {
      title: "الإدارة والإعدادات",
      items: [
        { href: "/branches", label: "الفروع", icon: Store, permission: "/branches" },
        { href: "/expenses", label: "المصروفات", icon: Wallet, permission: "/expenses" },
        { href: "/tax", label: "الإقرار الضريبي", icon: FileText, permission: "/tax" },
        { href: "/settings/categories", label: "الأقسام والوحدات", icon: Tags, permission: "/settings" },
        { href: "/settings", label: "الإعدادات", icon: Settings, permission: "/settings" },
        { href: "/settings/printers", label: "إعدادات الطابعات", icon: Printer, permission: "/settings" },
        { href: "/backup", label: "النسخ الاحتياطي", icon: Database, permission: "/backup" },
        { href: "/audit-log", label: "سجل النشاط", icon: ClipboardList, permission: "/audit-log" },
        { href: "/help", label: "دليل الاستخدام", icon: HelpCircle },
      ],
    },
  ];

  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasPermission(item.permission)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-80 max-w-[85vw] bg-[var(--color-card-bg)] h-full shadow-2xl flex flex-col z-10"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-primary-100 bg-gradient-to-l from-primary-50 to-white">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Salesaty" className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" />
                <h2 className="text-lg font-extrabold bg-gradient-to-l from-primary-600 to-primary-400 bg-clip-text text-transparent">
                  Salesaty
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-[var(--color-neutral-500)] hover:text-danger-600 hover:bg-danger-50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-5">
              {visibleSections.map((section) => (
                <div key={section.title}>
                  <p className="text-[11px] font-extrabold text-[var(--color-neutral-400)] uppercase tracking-wider mb-2 px-2">
                    {section.title}
                  </p>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--color-neutral-700)] hover:text-primary-600 hover:bg-primary-50 transition-all duration-200"
                      >
                        <item.icon
                          size={18}
                          className="text-[var(--color-neutral-400)] group-hover:text-primary-500 transition-colors"
                        />
                        <span className="text-sm font-semibold">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--color-card-border)] text-center text-xs text-[var(--color-neutral-400)]">
              © 2026 Salesaty
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}