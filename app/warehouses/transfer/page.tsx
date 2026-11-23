"use client";

import { useState, useEffect } from "react";
import Header from "../../../components/Header";
import Link from "next/link";
import { ArrowRight, Layers, Warehouse, Package, Search, Send, Calendar, User, FileText } from "lucide-react";
import { showSuccess, showError } from "@/utils/alerts";

type Product = {
  id: number;
  name: string;
  barcode: string | null;
  costPrice: number;
  sellPrice: number;
  productUnits: { id: number; name: string; factor: number; price: number; isBase: boolean }[];
  productStocks: { warehouseId: number; stock: number }[];
};

type Warehouse = { id: number; name: string };

export default function TransferPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitId, setUnitId] = useState("");
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [sellPrice, setSellPrice] = useState(0);
  const [responsible, setResponsible] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, whRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/warehouses"),
        ]);
        if (prodRes.ok) setProducts(await prodRes.json());
        if (whRes.ok) setWarehouses(await whRes.json());
      } catch {
        showError("حدث خطأ في جلب البيانات");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return p.name.toLowerCase().includes(term) || (p.barcode && p.barcode.includes(term));
  });

  const selectedProduct = products.find((p) => p.id === Number(selectedProductId));
  const availableInSource = selectedProduct?.productStocks.find(
    (s) => s.warehouseId === Number(fromWarehouseId)
  )?.stock || 0;

  const handleProductSelect = (product: Product) => {
    setSelectedProductId(product.id.toString());
    const baseUnit = product.productUnits.find((u) => u.isBase) || product.productUnits[0];
    setUnitId(baseUnit?.id.toString() || "");
    setPurchasePrice(product.costPrice);
    setSellPrice(product.sellPrice);
    setSearchTerm("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromWarehouseId || !toWarehouseId || !selectedProductId) {
      showError("اختر المخزن المصدر والمستقبل والمنتج");
      return;
    }
    if (fromWarehouseId === toWarehouseId) {
      showError("لا يمكن التحويل لنفس المخزن");
      return;
    }

    const selectedUnit = selectedProduct?.productUnits.find((u) => u.id === Number(unitId));
    const factor = selectedUnit?.factor || 1;
    const totalQty = quantity * factor;

    if (totalQty > availableInSource) {
      showError(`الكمية المتوفرة ${availableInSource} فقط`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/warehouses/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromWarehouseId: Number(fromWarehouseId),
          toWarehouseId: Number(toWarehouseId),
          productId: Number(selectedProductId),
          quantity: Number(quantity),
          unitId: Number(unitId) || null,
          unitName: selectedUnit?.name || null,
          factor,
          purchasePrice: Number(purchasePrice),
          sellPrice: Number(sellPrice),
          responsible,
          reason,
        }),
      });

      if (res.ok) {
        showSuccess("تم التحويل بنجاح!");
        // إعادة تعيين
        setSelectedProductId("");
        setQuantity(1);
        setReason("");
        const prodRes = await fetch("/api/products");
        if (prodRes.ok) setProducts(await prodRes.json());
      } else {
        const data = await res.json();
        showError(data.error || "حدث خطأ");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-pulse-soft">
          <Layers className="text-primary-500 mx-auto mb-4" size={48} />
          <p className="text-[var(--color-neutral-500)] font-bold">جاري التحميل...</p>
        </div>
      </div>
    );

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-6 animate-slide-down">
          <Link
            href="/warehouses"
            className="text-[var(--color-neutral-500)] hover:text-primary-600 hover:bg-primary-50 transition-colors p-2 rounded-lg"
          >
            <ArrowRight size={22} />
          </Link>
          <div className="p-3 rounded-xl bg-orange-100">
            <Layers className="text-orange-600" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">تحويل بين المخازن</h1>
            <p className="text-sm text-[var(--color-neutral-500)] mt-1">نقل المنتجات من مخزن لآخر</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Product selection */}
          <div className="bg-[var(--color-card-bg)] p-5 rounded-2xl shadow-sm border border-[var(--color-card-border)] animate-slide-up">
            <h2 className="text-lg font-extrabold text-[var(--color-fg)] mb-3 flex items-center gap-2">
              <Package className="text-primary-500" size={20} /> اختيار المنتج
            </h2>

            <div className="relative mb-3">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]" size={16} />
              <input
                type="text"
                placeholder="ابحث بالاسم أو الباركود..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border-2 border-[var(--color-neutral-200)] p-2.5 pr-9 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 text-sm"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <p className="text-center text-[var(--color-neutral-500)] py-6 text-sm">لا توجد منتجات مطابقة.</p>
              ) : (
                filteredProducts.map((p) => {
                  const available = p.productStocks.find(
                    (s) => s.warehouseId === Number(fromWarehouseId)
                  )?.stock || 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleProductSelect(p)}
                      className={`w-full text-right p-3 rounded-xl border-2 transition-all ${
                        selectedProductId === p.id.toString()
                          ? "border-primary-400 bg-primary-50"
                          : "border-[var(--color-neutral-200)] hover:border-primary-300 hover:bg-primary-50/50"
                      }`}
                    >
                      <div className="font-bold text-sm text-[var(--color-fg)]">{p.name}</div>
                      <div className="text-xs text-[var(--color-neutral-500)]">
                        {p.barcode || "بدون باركود"} · المتوفر: {available}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Transfer form */}
          <form onSubmit={handleSubmit} className="bg-[var(--color-card-bg)] p-5 rounded-2xl shadow-sm border border-[var(--color-card-border)] animate-slide-up space-y-4">
            <h2 className="text-lg font-extrabold text-[var(--color-fg)] flex items-center gap-2">
              <Layers className="text-orange-500" size={20} /> بيانات التحويل
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1">من مخزن</label>
                <select
                  value={fromWarehouseId}
                  onChange={(e) => setFromWarehouseId(e.target.value)}
                  required
                  className="w-full border-2 border-[var(--color-neutral-200)] p-2.5 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
                >
                  <option value="">اختر المصدر</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1">إلى مخزن</label>
                <select
                  value={toWarehouseId}
                  onChange={(e) => setToWarehouseId(e.target.value)}
                  required
                  className="w-full border-2 border-[var(--color-neutral-200)] p-2.5 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
                >
                  <option value="">اختر المستقبل</option>
                  {warehouses.filter((w) => w.id.toString() !== fromWarehouseId).map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedProduct && (
              <>
                <div className="bg-info-500/10 p-3 rounded-xl text-sm">
                  <div className="font-bold text-info-500">المنتج المحدد: {selectedProduct.name}</div>
                  <div className="text-xs text-[var(--color-neutral-600)] mt-1">
                    المتوفر في المخزن المصدر: <strong>{availableInSource}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1">الكمية</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      min={1}
                      required
                      className="w-full border-2 border-[var(--color-neutral-200)] p-2.5 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1">الوحدة</label>
                    <select
                      value={unitId}
                      onChange={(e) => setUnitId(e.target.value)}
                      className="w-full border-2 border-[var(--color-neutral-200)] p-2.5 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
                    >
                      {selectedProduct.productUnits.map((u) => (
                        <option key={u.id} value={u.id}>{u.name} (×{u.factor})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1">سعر الشراء</label>
                    <input
                      type="number"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(Number(e.target.value))}
                      className="w-full border-2 border-[var(--color-neutral-200)] p-2.5 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1">سعر البيع</label>
                    <input
                      type="number"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(Number(e.target.value))}
                      className="w-full border-2 border-[var(--color-neutral-200)] p-2.5 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1 flex items-center gap-1">
                <User size={12} className="text-[var(--color-neutral-400)]" /> المسؤول عن التحويل
              </label>
              <input
                type="text"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className="w-full border-2 border-[var(--color-neutral-200)] p-2.5 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
                placeholder="اسم المسؤول"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1 flex items-center gap-1">
                <FileText size={12} className="text-[var(--color-neutral-400)]" /> سبب التحويل (اختياري)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border-2 border-[var(--color-neutral-200)] p-2.5 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
                placeholder="مثال: نقل بضاعة"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 active:scale-[0.97] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm shadow-primary-200"
            >
              <Send size={18} /> {submitting ? "جاري التحويل..." : "تنفيذ التحويل"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}