"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../components/Header";
import {
  Search,
  ReceiptText,
  Trash2,
  Save,
  Package,
  Warehouse,
  UserPlus,
  X,
  Wallet,
} from "lucide-react";
import { showSuccess, showError, showInput } from "@/utils/alerts";

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
  barcode: string | null;
  sellPrice: number;
  stock: number;
  productUnits: ProductUnit[];
};

type Customer = { id: number; name: string; phone: string };
type Warehouse = { id: number; name: string };
type Cashbox = { id: number; name: string; balance: number };

type CartItem = {
  key: string;
  productId: number;
  name: string;
  unitId: number | null;
  unitName: string;
  factor: number;
  unitPrice: number;
  quantity: number;
  discount: number;
};

export default function CreateInvoicePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [cashboxes, setCashboxes] = useState<Cashbox[]>([]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedCashbox, setSelectedCashbox] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paidAmount, setPaidAmount] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(14);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, custRes, whRes, cbRes, setRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/customers"),
          fetch("/api/warehouses"),
          fetch("/api/cashboxes"),
          fetch("/api/settings"),
        ]);
        if (prodRes.ok) {
          const data = await prodRes.json();
          setProducts(Array.isArray(data) ? data : data.data || []);
        }
        if (custRes.ok) setCustomers(await custRes.json());
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
        if (setRes.ok) {
          const set = await setRes.json();
          if (set.defaultTaxRate) setTaxRate(set.defaultTaxRate);
        }
      } catch {
        showError("حدث خطأ في جلب البيانات");
      }
    };
    fetchData();
  }, []);

  const getAvailableUnits = (product: Product): ProductUnit[] => {
    if (product.productUnits && product.productUnits.length > 0) return product.productUnits;
    return [{ id: 0, name: "وحدة", factor: 1, price: product.sellPrice, isBase: true }];
  };

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return p.name.toLowerCase().includes(term) || (p.barcode && p.barcode.includes(term));
  });

  const filteredCustomers = customers.filter((c) => {
    const term = customerSearch.toLowerCase();
    if (!term) return true;
    return c.name.toLowerCase().includes(term) || c.phone.includes(term);
  });

  const addToCart = (product: Product) => {
    const units = getAvailableUnits(product);
    const baseUnit = units.find((u) => u.isBase) || units[0];
    const key = `${product.id}-${baseUnit.id}`;
    const existing = cart.find((item) => item.key === key);

    if (existing) {
      // ✅ التحقق من المخزون قبل الزيادة
      const newQty = existing.quantity + 1;
      const maxQty = Math.floor(product.stock / existing.factor);
      if (newQty > maxQty) {
        showError(`الكمية المتوفرة من "${product.name}" غير كافية. المتوفر: ${maxQty}`);
        return;
      }
      setCart((prev) =>
        prev.map((item) =>
          item.key === key ? { ...item, quantity: newQty } : item
        )
      );
    } else {
      // ✅ التحقق من المخزون قبل الإضافة
      const maxQty = Math.floor(product.stock / baseUnit.factor);
      if (maxQty < 1) {
        showError(`الكمية المتوفرة من "${product.name}" غير كافية`);
        return;
      }
      setCart((prev) => [
        ...prev,
        {
          key,
          productId: product.id,
          name: product.name,
          unitId: baseUnit.id,
          unitName: baseUnit.name,
          factor: baseUnit.factor,
          unitPrice: baseUnit.price,
          quantity: 1,
          discount: 0,
        },
      ]);
    }
    setSearchTerm("");
  };

  const updateItem = (key: string, field: keyof CartItem, value: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;

        // ✅ لو بيعدل الكمية، نتأكد من المخزون
        if (field === "quantity") {
          const product = products.find((p) => p.id === item.productId);
          if (product) {
            const maxQty = Math.floor(product.stock / item.factor);
            if (value > maxQty) {
              showError(`الكمية المتوفرة من "${product.name}" غير كافية. المتوفر: ${maxQty}`);
              return item;
            }
          }
        }

        return { ...item, [field]: value };
      })
    );
  };

  const removeFromCart = (key: string) => {
    setCart((prev) => prev.filter((item) => item.key !== key));
  };

  const quickAddCustomer = async () => {
    const phone = await showInput("إضافة عميل جديد", "رقم التليفون");
    if (!phone) return;
    const name = await showInput("إضافة عميل جديد", "اسم العميل");
    if (!name) return;

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      if (res.ok) {
        const newCustomer = await res.json();
        setCustomers([...customers, newCustomer]);
        setSelectedCustomer(newCustomer);
        showSuccess("تم إضافة العميل");
      } else {
        showError("الرقم مسجل بالفعل");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    }
  };

  const subTotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity - item.discount,
    0
  );
  const taxAmount = (subTotal - discount) * (taxRate / 100);
  const finalTotal = subTotal - discount + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      showError("أضف منتجات للفاتورة");
      return;
    }
    if (!selectedWarehouse) {
      showError("اختر المخزن");
      return;
    }

    // ✅ التحقق النهائي من المخزون
    for (const item of cart) {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        const qty = item.quantity * item.factor;
        if (product.stock < qty) {
          showError(`الكمية المتوفرة من "${product.name}" غير كافية. المتوفر: ${product.stock}`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const invoiceItems = cart.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        sellPrice: item.unitPrice,
        unitId: item.unitId,
        unitName: item.unitName,
        factor: item.factor,
      }));

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: invoiceItems,
          subTotal,
          discount,
          tax: taxAmount,
          total: finalTotal,
          paymentMethod,
          paidAmount: paymentMethod === "CASH" ? finalTotal : paidAmount,
          dueDate: dueDate || null,
          customerId: selectedCustomer?.id || null,
          warehouseId: Number(selectedWarehouse),
          cashboxId: paymentMethod === "CASH" && selectedCashbox ? Number(selectedCashbox) : null,
        }),
      });

      if (res.ok) {
        const invoiceData = await res.json();
        localStorage.setItem("lastInvoice", JSON.stringify({
          ...invoiceData,
          items: cart.map((i) => ({ ...i, sellPrice: i.unitPrice })),
          subTotal,
          discount,
          tax: taxAmount,
          total: finalTotal,
          customerName: selectedCustomer?.name || "عميل نقدي",
        }));

        showSuccess("تم إنشاء الفاتورة بنجاح!");
        router.push("/invoices");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        showError(data.error || "حدث خطأ");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6 h-[calc(100vh-4rem)] flex flex-col md:flex-row gap-6 animate-fade-in">
        {/* Left: Products */}
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
              placeholder="ابحث بالاسم أو الباركود..."
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
                <span className="text-success-600 font-bold text-sm">{product.sellPrice} ج.م</span>
                <span className={`text-xs ${product.stock < 5 ? "text-danger-500" : "text-[var(--color-neutral-500)]"}`}>
                  متوفر: {product.stock}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Invoice */}
        <form onSubmit={handleSubmit} className="w-full md:w-[440px] bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] p-4 flex flex-col">
          <h2 className="text-xl font-extrabold text-[var(--color-fg)] mb-4 border-b border-[var(--color-card-border)] pb-3 flex items-center gap-2">
            <ReceiptText className="text-primary-500" size={22} /> فاتورة جديدة
          </h2>

          <div className="mb-4 space-y-3">
            <div className="bg-[var(--color-bg)] p-3 rounded-xl border border-[var(--color-neutral-200)]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-[var(--color-neutral-700)]">العميل</label>
                {!selectedCustomer && (
                  <button
                    type="button"
                    onClick={quickAddCustomer}
                    className="flex items-center gap-1 text-xs bg-info-500 text-white px-2.5 py-1 rounded-lg hover:opacity-90 font-bold"
                  >
                    <UserPlus size={12} /> عميل جديد
                  </button>
                )}
              </div>
              {selectedCustomer ? (
                <div className="flex items-center justify-between bg-primary-100 px-3 py-2 rounded-lg text-sm text-primary-800">
                  <span className="font-bold">{selectedCustomer.name} - {selectedCustomer.phone}</span>
                  <button type="button" onClick={() => setSelectedCustomer(null)} className="text-danger-600 hover:bg-danger-50 rounded p-1">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ابحث بالاسم أو التليفون..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full border border-[var(--color-neutral-300)] p-2 rounded-lg text-sm focus:border-primary-400 focus:outline-none"
                  />
                  {customerSearch && (
                    <div className="absolute z-10 w-full bg-[var(--color-card-bg)] border border-[var(--color-neutral-200)] mt-1 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {filteredCustomers.length === 0 ? (
                        <div className="p-2 text-sm text-[var(--color-neutral-500)]">لا يوجد مطابق</div>
                      ) : (
                        filteredCustomers.slice(0, 10).map((c) => (
                          <div
                            key={c.id}
                            onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); }}
                            className="p-2 text-sm hover:bg-primary-50 cursor-pointer"
                          >
                            {c.name} - {c.phone}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-[var(--color-neutral-700)] mb-1 flex items-center gap-1">
                  <Warehouse size={12} className="text-[var(--color-neutral-400)]" /> المخزن
                </label>
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-2 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
                  required
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--color-neutral-700)] mb-1">طريقة الدفع</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-2 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
                >
                  <option value="CASH">كاش</option>
                  <option value="CREDIT">آجل</option>
                </select>
              </div>
            </div>

            {paymentMethod === "CASH" && cashboxes.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-[var(--color-neutral-700)] mb-1 flex items-center gap-1">
                  <Wallet size={12} className="text-[var(--color-neutral-400)]" /> الخزنة (اختياري)
                </label>
                <select
                  value={selectedCashbox}
                  onChange={(e) => setSelectedCashbox(e.target.value)}
                  className="w-full border-2 border-[var(--color-neutral-200)] p-2 rounded-xl focus:border-primary-400 focus:outline-none text-sm"
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
                  <label className="block text-xs font-bold text-[var(--color-neutral-700)] mb-1">مدفوع</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full border-2 border-[var(--color-neutral-200)] p-2 rounded-xl text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--color-neutral-700)] mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full border-2 border-[var(--color-neutral-200)] p-2 rounded-xl text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto mb-4 space-y-2 min-h-0">
            {cart.length === 0 ? (
              <div className="text-center text-[var(--color-neutral-400)] mt-10">
                <ReceiptText className="mx-auto mb-2 opacity-30" size={48} />
                <p>الفاتورة فارغة</p>
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
                        className="w-full border border-[var(--color-neutral-300)] rounded-lg p-1 text-sm text-center focus:border-primary-400 focus:outline-none"
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[var(--color-neutral-500)] mb-0.5">السعر</label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.key, "unitPrice", Number(e.target.value))}
                        className="w-full border border-[var(--color-neutral-300)] rounded-lg p-1 text-sm text-center focus:border-primary-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[var(--color-neutral-500)] mb-0.5">الإجمالي</label>
                      <div className="w-full bg-[var(--color-card-bg)] border border-[var(--color-neutral-200)] rounded-lg p-1 text-sm text-center font-bold text-primary-600">
                        {(item.unitPrice * item.quantity - item.discount).toFixed(2)}
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
              <span className="font-bold">{subTotal.toFixed(2)} ج.م</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--color-neutral-600)]">الخصم (ج.م):</span>
              <input
                type="number"
                value={discount || ""}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-24 border border-[var(--color-neutral-300)] p-1.5 rounded-lg text-left text-sm"
                placeholder="0"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--color-neutral-600)]">الضريبة (%):</span>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-24 border border-[var(--color-neutral-300)] p-1.5 rounded-lg text-left text-sm"
              />
            </div>
            <div className="flex justify-between text-sm text-[var(--color-neutral-600)]">
              <span>قيمة الضريبة:</span>
              <span className="font-bold">{taxAmount.toFixed(2)} ج.م</span>
            </div>
            <div className="flex justify-between text-xl font-extrabold pt-2 border-t border-[var(--color-card-border)]">
              <span>الإجمالي:</span>
              <span className="text-primary-600">{finalTotal.toFixed(2)} ج.م</span>
            </div>

            <button
              type="submit"
              disabled={saving || cart.length === 0}
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