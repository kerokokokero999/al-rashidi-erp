"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";

type ChartData = {
  day: string;
  sales: number;
  profit: number;
};

export default function DashboardCharts({ data }: { data: ChartData[] }) {
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  const totalSales = data.reduce((sum, d) => sum + d.sales, 0);
  const totalProfit = data.reduce((sum, d) => sum + d.profit, 0);

  // ✅ formatter مع type-safe
  const tooltipFormatter = (value: unknown, name: unknown): [string, string] => {
    const numValue = Number(value) || 0;
    const label = String(name) === "sales" ? "المبيعات" : "الأرباح";
    return [`${numValue.toLocaleString("ar-EG")} ج.م`, label];
  };

  const legendFormatter = (value: string) =>
    value === "sales" ? "المبيعات" : "الأرباح";

  return (
    <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] mb-8 animate-slide-up">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h2 className="text-xl font-extrabold text-[var(--color-fg)] flex items-center gap-2">
          <BarChart3 className="text-primary-500" size={22} /> مبيعات آخر 7 أيام
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType("bar")}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
              chartType === "bar" ? "bg-primary-500 text-white" : "bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]"
            }`}
          >
            أعمدة
          </button>
          <button
            onClick={() => setChartType("line")}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
              chartType === "line" ? "bg-primary-500 text-white" : "bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]"
            }`}
          >
            خطي
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-primary-50 p-3 rounded-xl">
          <div className="text-xs text-[var(--color-neutral-500)] mb-0.5 flex items-center gap-1">
            <TrendingUp size={12} /> إجمالي المبيعات (7 أيام)
          </div>
          <div className="text-lg font-extrabold text-primary-600">
            {totalSales.toLocaleString("ar-EG")} ج.م
          </div>
        </div>
        <div className="bg-success-100 p-3 rounded-xl">
          <div className="text-xs text-[var(--color-neutral-500)] mb-0.5 flex items-center gap-1">
            <TrendingUp size={12} /> إجمالي الأرباح (7 أيام)
          </div>
          <div className="text-lg font-extrabold text-success-600">
            {totalProfit.toLocaleString("ar-EG")} ج.م
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
                formatter={tooltipFormatter}
              />
              <Legend formatter={legendFormatter} wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="sales" fill="#FA699E" radius={[6, 6, 0, 0]} />
              <Bar dataKey="profit" fill="#4ADD82" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
                formatter={tooltipFormatter}
              />
              <Legend formatter={legendFormatter} wrapperStyle={{ fontSize: "12px" }} />
              <Line type="monotone" dataKey="sales" stroke="#FA699E" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="profit" stroke="#4ADD82" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}