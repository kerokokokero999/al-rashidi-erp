import { prisma } from "../../../lib/prisma";
import Header from "../../../components/Header";
import Link from "next/link";
import {
  ShoppingCart,
  Package,
  TrendingUp,
  DollarSign,
  ReceiptText,
  AlertTriangle,
  Star,
  Warehouse,
  Wallet,
  FileText,
  Banknote,
  Users,
  Truck,
  UserGroup,
  BarChart3,
  Settings,
  RotateCcw,
  ShoppingBag,
} from "lucide-react";
import { getCurrentUser } from "../../../lib/auth";
import { redirect } from "next/navigation";
import DashboardCharts from "../../../components/DashboardCharts";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/pos");

  const totalInvoices = await prisma.invoice.count();
  const totalProducts = await prisma.product.count();
  const totalCustomers = await prisma.customer.count();
  const totalSuppliers = await prisma.supplier.count();

  const totalSalesData = await prisma.invoice.aggregate({ _sum: { total: true } });
  const totalSales = totalSalesData._sum.total || 0;

  const allProducts = await prisma.product.findMany({
    include: { unit: true, category: true },
  });

  const invoices = await prisma.invoice.findMany({
    include: { items: true },
  });

  // آخر 7 أيام مبيعات + أرباح
  const last7Days: { day: string; sales: number; profit: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dayInvoices = invoices.filter(
      (inv) => inv.createdAt >= date && inv.createdAt < nextDate
    );
    const daySales = dayInvoices.reduce((sum, inv) => sum + inv.total, 0);

    let dayProfit = 0;
    dayInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const product = allProducts.find((p) => p.id === item.productId);
        if (product) {
          dayProfit += (item.sellPrice - product.costPrice) * item.quantity;
        }
      });
    });

    last7Days.push({
      day: date.toLocaleDateString("ar-EG", { weekday: "short" }),
      sales: Math.round(daySales),
      profit: Math.round(dayProfit),
    });
  }

  let estimatedProfit = 0;
  const productSales: Record<number, { name: string; qty: number }> = {};

  invoices.forEach((inv) => {
    inv.items.forEach((item) => {
      if (!productSales[item.productId || 0]) {
        productSales[item.productId || 0] = { name: item.name, qty: 0 };
      }
      productSales[item.productId || 0].qty += item.quantity;

      const product = allProducts.find((p) => p.id === item.productId);
      if (product) {
        estimatedProfit += (item.sellPrice - product.costPrice) * item.quantity;
      }
    });
  });

  const topSelling = Object.values(productSales).sort((a, b) => b.qty - a.qty).slice(0, 5);
  const lowStock = allProducts.filter((p) => p.stock <= p.minStock).sort((a, b) => a.stock - b.stock);

  const stats = [
    { title: "إجمالي المبيعات", value: `${totalSales.toLocaleString("ar-EG")} ج.م`, icon: DollarSign, color: "text-primary-600", bg: "bg-primary-100" },
    { title: "الأرباح التقديرية", value: `${estimatedProfit.toLocaleString("ar-EG")} ج.م`, icon: TrendingUp, color: "text-success-600", bg: "bg-success-100" },
    { title: "عدد الفواتير", value: totalInvoices.toString(), icon: ReceiptText, color: "text-orange-600", bg: "bg-orange-100" },
    { title: "المنتجات", value: totalProducts.toString(), icon: Package, color: "text-info-500", bg: "bg-info-500/10" },
    { title: "العملاء", value: totalCustomers.toString(), icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
    { title: "الموردين", value: totalSuppliers.toString(), icon: Truck, color: "text-cyan-600", bg: "bg-cyan-100" },
  ];

  const shortcuts = [
    { href: "/pos", label: "الكاشير", icon: ShoppingCart, color: "from-primary-500 to-primary-700", desc: "ابدأ تسجيل الفواتير" },
    { href: "/products", label: "المنتجات", icon: Package, color: "from-info-500 to-info-700", desc: "إدارة المنتجات" },
    { href: "/warehouses", label: "المخازن", icon: Warehouse, color: "from-orange-500 to-orange-700", desc: "المخازن والجرد" },
    { href: "/invoices", label: "الفواتير", icon: ReceiptText, color: "from-success-500 to-success-700", desc: "فواتير المبيعات" },
    { href: "/purchases", label: "المشتريات", icon: ShoppingBag, color: "from-purple-500 to-purple-700", desc: "فواتير المشتريات" },
    { href: "/suppliers", label: "الموردين", icon: Truck, color: "from-cyan-500 to-cyan-700", desc: "إدارة الموردين" },
    { href: "/customers", label: "العملاء", icon: Users, color: "from-pink-500 to-pink-700", desc: "إدارة العملاء" },
    { href: "/employees", label: "الموظفين", icon: UserGroup, color: "from-indigo-500 to-indigo-700", desc: "الموظفين والمرتبات" },
    { href: "/returns", label: "المرتجعات", icon: RotateCcw, color: "from-orange-500 to-red-600", desc: "المرتجعات" },
    { href: "/treasury", label: "الخزنة والبنك", icon: Wallet, color: "from-teal-500 to-teal-700", desc: "الأرصدة والحركات" },
    { href: "/vouchers/report", label: "السندات", icon: FileText, color: "from-amber-500 to-amber-700", desc: "قبض وصرف" },
    { href: "/expenses", label: "المصروفات", icon: Banknote, color: "from-rose-500 to-rose-700", desc: "إدارة المصروفات" },
    { href: "/reports", label: "التقارير", icon: BarChart3, color: "from-slate-600 to-slate-800", desc: "كل التقارير" },
    { href: "/tax", label: "الإقرار الضريبي", icon: FileText, color: "from-red-500 to-red-700", desc: "تقرير الضريبة" },
    { href: "/settings", label: "الإعدادات", icon: Settings, color: "from-neutral-600 to-neutral-800", desc: "إعدادات النظام" },
  ];

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-10 animate-slide-down">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--color-fg)] mb-4">
            أهلاً بك في{" "}
            <span className="bg-gradient-to-l from-primary-600 to-primary-400 bg-clip-text text-transparent">
              Salesaty
            </span>
          </h1>
          <p className="text-[var(--color-neutral-500)] text-lg max-w-2xl mx-auto">
            النظام المتكامل لإدارة المبيعات والمخزون والمشتريات
          </p>
        </div>

        {/* Stats - 6 كروت */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8 stagger-children">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-[var(--color-card-bg)] p-4 rounded-2xl shadow-sm border border-[var(--color-card-border)] flex flex-col items-center text-center hover:shadow-lg hover:border-primary-200 transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} mb-2`}>
                <stat.icon size={20} />
              </div>
              <p className="text-[var(--color-neutral-500)] text-[11px] mb-0.5">{stat.title}</p>
              <h3 className="text-base font-extrabold text-[var(--color-fg)]">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Charts */}
        <DashboardCharts data={last7Days} />

        {/* Shortcuts Grid */}
        <div className="mb-10">
          <h2 className="text-2xl font-extrabold text-[var(--color-fg)] mb-5 flex items-center gap-2 animate-slide-down">
            <Star className="text-warning-500" size={24} /> اختصارات سريعة
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 stagger-children">
            {shortcuts.map((shortcut) => (
              <Link key={shortcut.href} href={shortcut.href}>
                <div
                  className={`relative overflow-hidden bg-gradient-to-br ${shortcut.color} rounded-2xl p-4 text-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full group`}
                >
                  <div className="absolute inset-0 bg-[var(--color-card-bg)]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <shortcut.icon size={24} className="mb-2 opacity-90" />
                    <h3 className="font-extrabold text-sm mb-1">{shortcut.label}</h3>
                    <p className="text-xs opacity-75 line-clamp-1">{shortcut.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] animate-slide-up">
            <h2 className="text-xl font-extrabold text-[var(--color-fg)] mb-4 flex items-center gap-2">
              <Star className="text-warning-500" size={22} /> المنتجات الأكثر مبيعاً
            </h2>
            <div className="space-y-2">
              {topSelling.length === 0 ? (
                <p className="text-[var(--color-neutral-500)] py-4 text-center">لا توجد مبيعات بعد.</p>
              ) : (
                topSelling.map((p, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-3 rounded-xl bg-[var(--color-bg)] hover:bg-primary-50 transition-colors"
                  >
                    <span className="font-bold text-[var(--color-fg)] flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      {p.name}
                    </span>
                    <span className="bg-warning-500/10 text-orange-700 px-3 py-1 rounded-full text-sm font-bold">
                      {p.qty} قطعة
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] animate-slide-up">
            <h2 className="text-xl font-extrabold text-danger-600 mb-4 flex items-center gap-2">
              <AlertTriangle size={22} /> منتجات قاربت على النفاذ
            </h2>
            <div className="space-y-2">
              {lowStock.length === 0 ? (
                <p className="text-success-600 font-bold py-4 text-center">المخزون بحالة جيدة ✅</p>
              ) : (
                lowStock.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between items-center p-3 rounded-xl bg-[var(--color-bg)] hover:bg-danger-50 transition-colors"
                  >
                    <span className="font-bold text-[var(--color-fg)]">{p.name}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        p.stock === 0
                          ? "bg-danger-500 text-white"
                          : "bg-danger-50 text-danger-700"
                      }`}
                    >
                      متبقي: {p.stock} {p.unit?.name || "قطعة"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}