"use client";

import { useState, useEffect } from "react";
import Header from "../../../components/Header";
import Link from "next/link";
import { ArrowRight, ClipboardList, Search, Package, Warehouse, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { showError } from "@/utils/alerts";

type ProductStock = {
  id: number;
  productId: number;
  warehouseId: number;
  stock: number;
  purchasePrice: number;
  product: {
    name: string;
    barcode: string | null;
    sellPrice: number;
    costPrice: number;
    unit: { name: string } | null;
  };
  warehouse: {
    name: string;
    branch: { name: string } | null;
  };
};

type Warehouse = { id: number; name: string };

export default function InventoryPage() {
  const [stocks, setStocks] = useState<ProductStock[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [barcodeSearch, setBarcodeSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedWarehouse !== "all") params.set("warehouseId", selectedWarehouse);
      if (barcodeSearch) params.set("barcode", barcodeSearch);

      const [stocksRes, whRes] = await Promise.all([
        fetch(`/api/warehouses/inventory?${params.toString()}`),
        fetch("/api/warehouses"),
      ]);

      if (stocksRes.ok) setStocks(await stocksRes.json());
      if (whRes.ok) setWarehouses(await whRes.json());
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
  }, [selectedWarehouse]);

  // إجماليات
  const totalQuantity = stocks.reduce((sum, s) => sum + s.stock, 0);
  const totalPurchaseValue = stocks.reduce((sum, s) => sum + s.stock * (s.purchasePrice || s.product.costPrice), 0);
  const totalSellValue = stocks.reduce((sum, s) => sum + s.stock * s.product.sellPrice, 0);
  const expectedProfit = totalSellValue - totalPurchaseValue;

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-6 animate-slide-down">
          <Link
            href="/warehouses"
            className="text-[var(--color-neutral-500)] hover:text-primary-600 hover:bg-primary-50 transition-colors p-2 rounded-lg"
          >
            <ArrowRight size={22} />
          </Link>
          <div className="p-3 rounded-xl bg-info-500/10">
            <ClipboardList className="text-info-500" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">جرد المخازن</h1>
            <p className="text-sm text-[var(--color-neutral-500)] mt-1">عرض أرصدة المنتجات في المخازن</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl shadow-sm border border-[var(--color-card-border)] mb-6 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5 flex items-center gap-1.5">
                <Warehouse size={14} className="text-[var(--color-neutral-400)]" /> المخزن
              </label>
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
              >
                <option value="all">كل المخازن</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1.5 flex items-center gap-1.5">
                <Search size={14} className="text-[var(--color-neutral-400)]" /> بحث بالباركود
              </label>
              <input
                type="text"
                placeholder="امسح أو اكتب الباركود..."
                value={barcodeSearch}
                onChange={(e) => setBarcodeSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchData()}
                className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchData}
                className="w-full bg-primary-500 text-white py-3 rounded-xl font-bold hover:bg-primary-600 active:scale-[0.97] transition-all"
              >
                بحث / تحديث
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 stagger-children">
          <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)]">
            <div className="text-xs text-[var(--color-neutral-500)] mb-0.5 flex items-center gap-1">
              <Package size={12} /> إجمالي الكمية
            </div>
            <div className="text-xl font-extrabold text-[var(--color-fg)]">{totalQuantity.toLocaleString("ar-EG")}</div>
          </div>
          <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)]">
            <div className="text-xs text-[var(--color-neutral-500)] mb-0.5 flex items-center gap-1">
              <DollarSign size={12} /> قيمة الشراء
            </div>
            <div className="text-xl font-extrabold text-info-500">{totalPurchaseValue.toLocaleString("ar-EG")} ج.م</div>
          </div>
          <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)]">
            <div className="text-xs text-[var(--color-neutral-500)] mb-0.5 flex items-center gap-1">
              <DollarSign size={12} /> قيمة البيع
            </div>
            <div className="text-xl font-extrabold text-success-600">{totalSellValue.toLocaleString("ar-EG")} ج.م</div>
          </div>
          <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)]">
            <div className="text-xs text-[var(--color-neutral-500)] mb-0.5 flex items-center gap-1">
              <TrendingUp size={12} /> الربح المتوقع
            </div>
            <div className="text-xl font-extrabold text-primary-600">{expectedProfit.toLocaleString("ar-EG")} ج.م</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] overflow-x-auto animate-slide-up">
          <table className="w-full text-right">
            <thead className="bg-[var(--color-bg)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
              <tr>
                <th className="p-4 font-bold">المنتج</th>
                <th className="p-4 font-bold">الباركود</th>
                <th className="p-4 font-bold">المخزن</th>
                <th className="p-4 font-bold">الكمية</th>
                <th className="p-4 font-bold">سعر الشراء</th>
                <th className="p-4 font-bold">سعر البيع</th>
                <th className="p-4 font-bold">قيمة المخزون</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="inline-block animate-pulse-soft">
                      <ClipboardList className="text-primary-500 mx-auto mb-2" size={32} />
                      <p className="text-[var(--color-neutral-500)] text-sm">جاري التحميل...</p>
                    </div>
                  </td>
                </tr>
              ) : stocks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <Package className="mx-auto text-neutral-300 mb-3" size={48} />
                    <p className="text-[var(--color-neutral-500)]">لا توجد منتجات في هذا المخزن.</p>
                  </td>
                </tr>
              ) : (
                stocks.map((s) => (
                  <tr key={s.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-[var(--color-fg)]">{s.product.name}</div>
                      {s.product.unit && (
                        <div className="text-xs text-[var(--color-neutral-400)]">{s.product.unit.name}</div>
                      )}
                    </td>
                    <td className="p-4 text-sm font-mono text-[var(--color-neutral-500)]">
                      {s.product.barcode || "—"}
                    </td>
                    <td className="p-4 text-sm text-[var(--color-neutral-600)]">
                      <div>{s.warehouse.name}</div>
                      {s.warehouse.branch && (
                        <div className="text-xs text-[var(--color-neutral-400)]">{s.warehouse.branch.name}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`font-bold ${s.stock <= 0 ? "text-danger-600" : s.stock < 5 ? "text-orange-600" : "text-[var(--color-fg)]"}`}>
                        {s.stock}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-[var(--color-neutral-600)]">
                      {(s.purchasePrice || s.product.costPrice).toLocaleString("ar-EG")} ج.م
                    </td>
                    <td className="p-4 text-sm text-success-600 font-bold">
                      {s.product.sellPrice.toLocaleString("ar-EG")} ج.م
                    </td>
                    <td className="p-4 font-bold text-primary-600">
                      {(s.stock * s.product.sellPrice).toLocaleString("ar-EG")} ج.م
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}