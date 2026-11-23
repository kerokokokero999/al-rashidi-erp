import { prisma } from "../lib/prisma";
import Link from "next/link";
import { ShoppingCart, Package, TrendingUp, DollarSign, ReceiptText } from "lucide-react";

export async function DashboardContent() {
  const totalInvoices = await prisma.invoice.count();
  const totalProducts = await prisma.product.count();
  const totalSalesData = await prisma.invoice.aggregate({ _sum: { total: true } });
  const totalSales = totalSalesData._sum.total || 0;
  const allProducts = await prisma.product.findMany();
  const invoices = await prisma.invoice.findMany({ include: { items: true } });

  let estimatedProfit = 0;
  invoices.forEach((inv) => {
    inv.items.forEach((item) => {
      const product = allProducts.find((p) => p.id === item.productId);
      if (product) {
        estimatedProfit += (item.sellPrice - product.costPrice) * item.quantity;
      }
    });
  });

  const stats = [
    { title: "إجمالي المبيعات", value: `${totalSales.toLocaleString("ar-EG")} ج.م`, icon: DollarSign, color: "text-primary-600", bg: "bg-primary-100" },
    { title: "الأرباح التقديرية", value: `${estimatedProfit.toLocaleString("ar-EG")} ج.م`, icon: TrendingUp, color: "text-success-600", bg: "bg-success-100" },
    { title: "عدد الفواتير", value: totalInvoices.toString(), icon: ReceiptText, color: "text-orange-600", bg: "bg-orange-100" },
    { title: "المنتجات بالمخزن", value: totalProducts.toString(), icon: Package, color: "text-blue-600", bg: "bg-blue-100" },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-10 animate-fade-in">
      <div className="text-center mb-12 animate-slide-down">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--color-fg)] mb-4">
          أهلاً بك في <span className="bg-gradient-to-l from-primary-600 to-primary-400 bg-clip-text text-transparent">Salesaty</span>
        </h1>
        <p className="text-[var(--color-neutral-500)] text-lg max-w-2xl mx-auto">
          النظام المتكامل لإدارة المبيعات والمخزون والمشتريات
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10 stagger-children">
        {stats.map((stat, index) => (
          <div key={index} className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] flex items-center gap-4 hover:shadow-lg hover:border-primary-200 transition-all duration-300 hover:-translate-y-1">
            <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={26} />
            </div>
            <div>
              <p className="text-[var(--color-neutral-500)] text-sm mb-1">{stat.title}</p>
              <h3 className="text-2xl font-extrabold text-[var(--color-fg)]">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/pos">
          <div className="relative overflow-hidden bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl p-8 text-white flex items-center justify-between shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full group">
            <div className="absolute inset-0 bg-[var(--color-card-bg)]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <h2 className="text-2xl font-extrabold mb-2">فتح الكاشير</h2>
              <p className="text-primary-50 opacity-90">ابدأ تسجيل الفواتير فوراً.</p>
            </div>
            <ShoppingCart size={48} className="opacity-40 group-hover:scale-110 group-hover:opacity-60 transition-all" />
          </div>
        </Link>

        <Link href="/products">
          <div className="relative overflow-hidden bg-gradient-to-br from-neutral-700 to-neutral-900 rounded-3xl p-8 text-white flex items-center justify-between shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full group">
            <div className="absolute inset-0 bg-[var(--color-card-bg)]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <h2 className="text-2xl font-extrabold mb-2">إدارة المخزون</h2>
              <p className="text-neutral-300">تحكم في المنتجات والكميات.</p>
            </div>
            <Package size={48} className="opacity-40 group-hover:scale-110 group-hover:opacity-60 transition-all" />
          </div>
        </Link>
      </div>
    </main>
  );
}