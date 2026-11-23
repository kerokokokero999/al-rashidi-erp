"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { showError } from "@/utils/alerts";

type ChartData = { day: string; sales: number };

export default function ReportsPage() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session && (session.user as { role?: string })?.role !== "ADMIN") {
      router.push("/pos");
      return;
    }

    const fetchReports = async () => {
      try {
        const res = await fetch("/api/reports");
        const chartData = await res.json();
        setData(chartData);
      } catch {
        showError("حدث خطأ في جلب البيانات");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [session, router]);

  const totalSales = data.reduce((sum, d) => sum + d.sales, 0);
  const avgSales = data.length > 0 ? totalSales / data.length : 0;
  const bestDay = data.reduce(
    (best, d) => (d.sales > best.sales ? d : best),
    { day: "—", sales: 0 }
  );

  if (loading)
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-pulse-soft">
          <BarChart3 className="text-primary-500 mx-auto mb-4" size={48} />
          <p className="text-[var(--color-neutral-500)] font-bold">جاري تحميل التقارير...</p>
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
            <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">تقارير المبيعات</h1>
            <p className="text-sm text-[var(--color-neutral-500)] mt-1">آخر 7 أيام</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 stagger-children">
          <div className="bg-[var(--color-card-bg)] p-5 rounded-2xl border border-[var(--color-card-border)] flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-success-100">
              <DollarSign className="text-success-600" size={22} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-neutral-500)] mb-0.5">إجمالي المبيعات</div>
              <div className="text-2xl font-extrabold text-[var(--color-fg)]">
                {totalSales.toLocaleString("ar-EG")} ج.م
              </div>
            </div>
          </div>
          <div className="bg-[var(--color-card-bg)] p-5 rounded-2xl border border-[var(--color-card-border)] flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-info-500/10">
              <TrendingUp className="text-info-500" size={22} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-neutral-500)] mb-0.5">متوسط المبيعات اليومي</div>
              <div className="text-2xl font-extrabold text-[var(--color-fg)]">
                {avgSales.toLocaleString("ar-EG", { maximumFractionDigits: 0 })} ج.م
              </div>
            </div>
          </div>
          <div className="bg-[var(--color-card-bg)] p-5 rounded-2xl border border-[var(--color-card-border)] flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-orange-100">
              <Calendar className="text-orange-600" size={22} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-neutral-500)] mb-0.5">أفضل يوم مبيعاً</div>
              <div className="text-xl font-extrabold text-[var(--color-fg)]">
                {bestDay.day}
                <span className="text-xs text-[var(--color-neutral-500)] block font-normal">
                  {bestDay.sales.toLocaleString("ar-EG")} ج.م
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] animate-slide-up">
          <h2 className="text-lg font-extrabold text-[var(--color-fg)] mb-4">مبيعات آخر 7 أيام</h2>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E2E5" />
                <XAxis dataKey="day" tick={{ fill: "#7C7077", fontSize: 12 }} />
                <YAxis tick={{ fill: "#7C7077", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #FFE7F0",
                    boxShadow: "0 10px 25px rgba(250,105,158,0.15)",
                    fontFamily: "inherit",
                    direction: "rtl",
                  }}
                  formatter={(value) => [`${Number(value).toLocaleString("ar-EG")} ج.م`, "المبيعات"]}
                />
                <Bar dataKey="sales" fill="#FA699E" radius={[8, 8, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </>
  );
}