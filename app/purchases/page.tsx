"use client";

import { useState, useEffect } from "react";
import Header from "../../components/Header";
import {
  Search,
  ShoppingBag,
  Trash2,
  Save,
  Package,
  Warehouse,
  Truck,
  Wallet,
} from "lucide-react";
import { showSuccess, showError } from "@/utils/alerts";

type ProductUnit = {
  id: number;
  name: string;
  factor: number;
  price: number;
  isBase: boolean;
};

type Product = {
  id: number;
  name: string;
  costPrice: number;
  sellPrice: number;
  unitId: number | null;
  unit: { name: string } | null;
  productUnits: ProductUnit[];
};

type Supplier = { id: number; name: string };
type Warehouse = { id: number; name: string; branch?: { name: string } | null };
type Cashbox = { id: number; name: string; balance: number };

type PurchaseItem = {
  key: string;
  productId: number;
  name: string;
  warehouseId: number;
  quantity: number;
  unitId: number | null;
  unitName: string;
  factor: number;
  costPrice: number;
  discount: number;
  tax: number;
  total: number;
};

export default function PurchasesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [cashboxes, setCashboxes] = useState<Cashbox[]>([]);
  const [cart, setCart] = useState<PurchaseItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [selectedCashbox, setSelectedCashbox] = useState<string>("");
  const [status, setStatus] = useState<string>("PENDING");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, supRes, whRes, cbRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/suppliers"),
          fetch("/api/warehouses"),
          fetch("/api/cashboxes"),
        ]);
        if (prodRes.ok) setProducts(await prodRes.json());
        if (supRes.ok) setSuppliers(await supRes.json());
        if (whRes.ok) {
          const whData = await whRes.json();
          setWarehouses(whData);
          if (whData.length > 0) setSelectedWarehouse(whData[0].id.toString());
        }
        if (cbRes.ok) {
          const cbData = await cbRes.json();
          setCashboxes(cbData);
          if (cbData.length > 0) setSelectedCashbox(cbData[0].id.toString());
        }
      } catch {
        showError("حدث خطأ في جلب البيانات");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAvailableUnits = (product: Product): ProductUnit[] => {
    if (product.productUnits && product.productUnits.length > 0) return product.productUnits;
    return [{
      id: 0,
      name: product.unit?.name || "وحدة",
      factor: 1,
      price: product.costPrice,
      isBase: true,
    }];
  };

  const addToCart = (product: Product) => {
    if (!selectedWarehouse) {
      showError("اختر المخزن أولاً");
      return;
    }

    const units = getAvailableUnits(product);
    const baseUnit = units.find((u) => u.isBase) || units[0];
    const key = `${product.id}-${baseUnit.id}-${selectedWarehouse}`;
    const existing = cart.find((item) => item.key === key);

    if (existing) {
      setCart((prev) =>
        prev.map((item) =>
          item.key === key
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.costPrice - item.discount + item.tax,
              }
            : item
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          key,
          productId: product.id,
          name: product.name,
          warehouseId: Number(selectedWarehouse),
          quantity: 1,
          unitId: baseUnit.id,
          unitName: baseUnit.name,
          factor: baseUnit.factor,
          costPrice: product.costPrice,
          discount: 0,
          tax: 0,
          total: product.costPrice,
        },
      ]);
    }
    setSearchTerm("");
  };

  const updateItem = (key: string, field: keyof PurchaseItem, value: number | string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        const updated = { ...item, [field]: value };
        const subtotal = updated.quantity * updated.costPrice;
        updated.total = subtotal - (updated.discount || 0) + (updated.tax || 0);
        return updated;
      })
    );
  };

  const removeFromCart = (key: string) => {
    setCart((prev) => prev.filter((item) => item.key !== key));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.costPrice, 0);
  const totalDiscount = cart.reduce((sum, item) => sum + item.discount, 0);
  const totalTax = cart.reduce((sum, item) => sum + item.tax, 0);
  const grandTotal = subtotal - totalDiscount + totalTax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      showError("لم تقم بإضافة أي منتجات!");
      return;
    }
    if (!selectedSupplier) {
      showError("يرجى اختيار المورد");
      return;
    }
    if (!selectedWarehouse) {
      showError("يرجى اختيار المخزن");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          total: grandTotal,
          supplierId: selectedSupplier,
          status,
          paymentMethod,
          paidAmount: paymentMethod === "CASH" ? grandTotal : paidAmount,
          dueDate: dueDate || null,
          cashboxId: paymentMethod === "CASH" && status === "RECEIVED" && selectedCashbox ? Number(selectedCashbox) : null,
        }),
      });

      if (res.ok) {
        showSuccess(
          status === "RECEIVED"
            ? "تم استلام البضاعة وتحديث المخزون!"
            : "تم تسجيل طلب الشراء!"
        );
        setCart([]);
        setSelectedSupplier("");
        setPaidAmount(0);
        setDueDate("");

        const updatedProducts = await fetch("/api/products").then((r) => r.json());
        setProducts(updatedProducts);
      } else {
        const data = await res.json().catch(() => ({}));
        showError(data.error || "حدث خطأ أثناء الحفظ.");
      }
    } catch {
      showError("حدث خطأ في الاتصال.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-pulse-soft">
          <ShoppingBag className="text-primary-500 mx-auto mb-4" size={48} />
          <p className="text-[var(--color-neutral-500)] font-bold">جاري التحميل...</p>
        </div>
      </div>
    );

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6 h-[calc(100vh-4rem)] flex flex-col md:flex-row gap-6 animate-fade-in">
        {/* LEFT: Products */}
        <div className="flex-1 bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] p-4 overflow-y-auto flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-extrabold text-[var(--color-fg)] flex items-center gap-2">
              <Package className="text-primary-500" size={22} /> المنتجات
            </h2>
            <span className="text-xs bg-info-500/10 text-info-500 px-2.5 py-1 rounded-lg font-bold">
              {products.length} منتج
            </span>
          </div>

          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]" size={18} />
            <input
              type="text"
              placeholder="ابحث عن منتج..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border-2 border-[var(--color-neutral-200)] p-3 pr-10 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-[var(--color-bg)] border border-[var(--color-neutral-200)] p-3 rounded-xl text-center hover:border-primary-300 hover:shadow-md transition-all flex flex-col items-center gap-1.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--color-card-bg)] flex items-center justify-center border border-[var(--color-card-border)] group-hover:scale-110 transition-transform">
                  <Package className="text-primary-500" size={20} />
                </div>
                <span className="font-bold text-sm line-clamp-2 text-[var(--color-fg)]">{product.name}</span>
                <span className="text-info-500 font-bold text-xs">تكلفة: {product.costPrice} ج.م</span>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Invoice */}
        <form onSubmit={handleSubmit} className="w-full md:w-[420px] bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] p-4 flex flex-col">
          <h2 className="text-xl font-extrabold text-[var(--color-fg)] mb-4 border-b border-[var(--color-card-border)] pb-3 flex items-center gap-2">
            <ShoppingBag className="text-primary-500" size={22} /> فاتورة مشتريات
          </h2>

          <div className="mb-4 space-y-3">
            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1 flex items-center gap-1.5">
                <Truck size={14} className="text-[var(--color-neutral-400)]" /> المورد
              </label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full border-2 border-[var(--color-neutral-200)] p-2.5 rounded-xl focus:border-primary-400 focus:outline-none"
                required
              >
                <option value="">-- اختر المورد --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1 flex items-center gap-1.5">
                <Warehouse size={14} className="text-[var(--color-neutral-400)]" /> المخزن
              </label>
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="w-full border-2 border-[var(--color-neutral-200)] p-2.5 rounded-xl focus:border-primary-400 focus:outline-none"
                required
              >
                <option value="">-- اختر المخزن --</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1">طريقة الدفع</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-2.5 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
                >
                  <option value="CASH">كاش</option>
                  <option value="CREDIT">آجل</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1">الحالة</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-2.5 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
                >
                  <option value="PENDING">معلق</option>
                  <option value="RECEIVED">استلام</option>
                </select>
              </div>
            </div>

            {/* Cashbox (only CASH + RECEIVED) */}
            {paymentMethod === "CASH" && status === "RECEIVED" && cashboxes.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1 flex items-center gap-1.5">
                  <Wallet size={14} className="text-[var(--color-neutral-400)]" /> الخزنة (اختياري)
                </label>
                <select
                  value={selectedCashbox}
                  onChange={(e) => setSelectedCashbox(e.target.value)}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-2.5 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
                >
                  <option value="">بدون خزنة</option>
                  {cashboxes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.balance.toLocaleString("ar-EG")} ج.م)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {paymentMethod === "CREDIT" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1">مدفوع</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full border-2 border-[var(--color-neutral-200)] p-2.5 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full border-2 border-[var(--color-neutral-200)] p-2.5 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto mb-4 space-y-2 min-h-0">
            {cart.length === 0 ? (
              <div className="text-center text-[var(--color-neutral-400)] mt-10">
                <ShoppingBag className="mx-auto mb-2 opacity-30" size={48} />
                <p>لم تقم بإضافة أي منتجات</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.key} className="bg-[var(--color-bg)] p-3 rounded-xl border border-[var(--color-card-border)] space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-[var(--color-fg)] truncate">{item.name}</div>
                      <div className="text-xs text-primary-600 bg-primary-100 inline-block px-2 py-0.5 rounded mt-1 font-bold">
                        {item.unitName}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.key)}
                      className="text-danger-500 hover:text-danger-700 hover:bg-danger-50 p-1 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <div>
                      <label className="block text-[10px] text-[var(--color-neutral-500)] mb-0.5">الكمية</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.key, "quantity", Number(e.target.value))}
                        className="w-full border border-neutral-300 rounded-lg p-1 text-sm text-center focus:border-primary-400 focus:outline-none"
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[var(--color-neutral-500)] mb-0.5">سعر الشراء</label>
                      <input
                        type="number"
                        value={item.costPrice}
                        onChange={(e) => updateItem(item.key, "costPrice", Number(e.target.value))}
                        className="w-full border border-neutral-300 rounded-lg p-1 text-sm text-center focus:border-primary-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[var(--color-neutral-500)] mb-0.5">الإجمالي</label>
                      <div className="w-full bg-[var(--color-card-bg)] border border-[var(--color-neutral-200)] rounded-lg p-1 text-sm text-center font-bold text-primary-600">
                        {item.total.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-[var(--color-card-border)] pt-3 mt-auto space-y-2">
            <div className="flex justify-between text-sm text-[var(--color-neutral-600)]">
              <span>الإجمالي الفرعي:</span>
              <span className="font-bold">{subtotal.toFixed(2)} ج.م</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-sm text-danger-600">
                <span>الخصم:</span>
                <span className="font-bold">-{totalDiscount.toFixed(2)} ج.م</span>
              </div>
            )}
            {totalTax > 0 && (
              <div className="flex justify-between text-sm text-[var(--color-neutral-600)]">
                <span>الضريبة:</span>
                <span className="font-bold">{totalTax.toFixed(2)} ج.م</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-extrabold pt-2 border-t border-[var(--color-card-border)]">
              <span>إجمالي التكلفة:</span>
              <span className="text-primary-600">{grandTotal.toFixed(2)} ج.م</span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 active:scale-[0.97] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm shadow-primary-200 mt-2"
            >
              <Save size={18} /> {saving ? "جاري الحفظ..." : "حفظ الفاتورة"}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}