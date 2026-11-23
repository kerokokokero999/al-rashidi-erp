"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Header from "../../components/Header";
import { Search, ShoppingCart, Trash2, Printer, PauseCircle, PlayCircle, Plus, Minus, Barcode, Package, UserPlus, X } from "lucide-react";
import { showSuccess, showError, showInput, showConfirm } from "@/utils/alerts";

type ProductUnit = {
  id: number;
  name: string;
  factor: number;
  price: number;
  barcode: string | null;
  isBase: boolean;
};

type Product = {
  id: number;
  name: string;
  barcode: string | null;
  sellPrice: number;
  stock: number;
  unitId: number | null;
  productUnits: ProductUnit[];
};

type CartItem = {
  key: string;
  productId: number;
  name: string;
  unitId: number | null;
  unitName: string;
  factor: number;
  unitPrice: number;
  basePrice: number;
  quantity: number;
  maxStock: number;
};

type Customer = {
  id: number;
  name: string;
  phone: string;
};

type Settings = {
  storeName: string;
  phone: string;
  whatsapp: string;
  address: string;
  taxNumber: string;
  currency: string;
  defaultTaxRate: number;
  defaultDiscount: number;
  autoPrintInvoice: boolean;
  enableBarcode: boolean;
  invoicePrefix: string;
};

type HeldInvoice = {
  id: string;
  items: CartItem[];
  discount: number;
  taxRate: number;
};

function getAvailableUnits(product: Product): ProductUnit[] {
  if (product.productUnits && product.productUnits.length > 0) {
    return product.productUnits;
  }
  return [
    {
      id: 0,
      name: "وحدة",
      factor: 1,
      price: product.sellPrice,
      barcode: product.barcode,
      isBase: true,
    },
  ];
}

export default function POSPage() {
  const { data: session } = useSession();
  const branchId = (session?.user as { branchId?: number })?.branchId;

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");

  const [discount, setDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(14);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");

  // ✅ lazy initializer — يقرأ من localStorage مرة واحدة بدون useEffect
  const [heldInvoices, setHeldInvoices] = useState<HeldInvoice[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("heldInvoices");
      if (!saved) return [];
      const parsed = JSON.parse(saved) as HeldInvoice[];
      return parsed.map((inv) => ({
        ...inv,
        items: inv.items.map((item, idx) => ({
          ...item,
          key: item.key || `${item.productId}-${item.unitId ?? 0}-${idx}`,
        })),
      }));
    } catch {
      return [];
    }
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [settings, setSettings] = useState<Settings | null>(null);

  const [selectedUnitByProduct, setSelectedUnitByProduct] = useState<Record<number, number>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resSettings = await fetch("/api/settings");
        if (resSettings.ok) {
          const dataSettings = await resSettings.json();
          setSettings(dataSettings);
          setTaxRate(dataSettings.defaultTaxRate);
          setDiscount(dataSettings.defaultDiscount);
        }

        const resProducts = await fetch("/api/products");
        const dataProducts = await resProducts.json();
        setProducts(dataProducts);

        const initialUnits: Record<number, number> = {};
        (dataProducts as Product[]).forEach((p) => {
          const units = getAvailableUnits(p);
          const base = units.find((u) => u.isBase) || units[0];
          initialUnits[p.id] = base.id;
        });
        setSelectedUnitByProduct(initialUnits);

        const resCustomers = await fetch("/api/customers");
        if (resCustomers.ok) {
          const dataCustomers = await resCustomers.json();
          setCustomers(dataCustomers);
        }

        setLoading(false);
      } catch {
        showError("حدث خطأ أثناء تحميل البيانات");
      }
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter((p) => {
    const search = searchTerm.toLowerCase();
    if (p.name.toLowerCase().includes(search)) return true;
    if (p.barcode && p.barcode.includes(search)) return true;
    return (p.productUnits || []).some((u) => u.barcode && u.barcode.includes(search));
  });

  const filteredCustomers = customers.filter((c) => {
    const search = customerSearch.toLowerCase();
    return c.name.toLowerCase().includes(search) || c.phone.includes(search);
  });

  const addToCart = (product: Product, unit?: ProductUnit) => {
    const units = getAvailableUnits(product);
    const unitId = unit ? unit.id : selectedUnitByProduct[product.id];
    const chosenUnit = units.find((u) => u.id === unitId) || units[0];

    const cartKey = `${product.id}-${chosenUnit.id}`;
    const existingItem = cart.find((item) => item.key === cartKey);
    const currentQty = existingItem ? existingItem.quantity : 0;
    const maxByUnit = Math.floor(product.stock / chosenUnit.factor);

    if (currentQty + 1 > maxByUnit) {
      showError("الكمية المتوفرة في المخزن لا تكفي!");
      return;
    }

    setCart((prev) => {
      if (existingItem) {
        return prev.map((item) =>
          item.key === cartKey ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          key: cartKey,
          productId: product.id,
          name: product.name,
          unitId: chosenUnit.id,
          unitName: chosenUnit.name,
          factor: chosenUnit.factor,
          unitPrice: chosenUnit.price,
          basePrice: chosenUnit.price,
          quantity: 1,
          maxStock: maxByUnit,
        },
      ];
    });
    setSearchTerm("");
  };

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const productByBarcode = products.find((p) => p.barcode === code);
    if (productByBarcode) {
      addToCart(productByBarcode);
      beep();
      return;
    }

    for (const p of products) {
      const unit = (p.productUnits || []).find((u) => u.barcode === code);
      if (unit) {
        addToCart(p, unit);
        beep();
        return;
      }
    }

    showError("الباركود غير موجود!");
    setBarcodeInput("");
  };

  const beep = () => {
    try {
      new Audio("/beep.mp3").play().catch(() => {});
    } catch {}
  };

  const updateQuantity = (key: string, newQty: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        if (newQty < 1) return item;
        if (newQty > item.maxStock) {
          showError(`الحد الأقصى ${item.maxStock} ${item.unitName}`);
          return item;
        }
        return { ...item, quantity: newQty };
      })
    );
  };

  const updatePrice = (key: string, newPrice: number) => {
    setCart((prev) =>
      prev.map((item) => (item.key === key ? { ...item, unitPrice: newPrice } : item))
    );
  };

  const removeFromCart = (key: string) => {
    setCart((prev) => prev.filter((item) => item.key !== key));
  };

  const subTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const taxAmount = (subTotal - discount) * (taxRate / 100);
  const finalTotal = subTotal - discount + taxAmount;

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
        setCustomerSearch("");
        showSuccess("تم إضافة العميل");
      } else {
        showError("الرقم مسجل بالفعل أو حدث خطأ.");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    }
  };

  const holdInvoice = () => {
    if (cart.length === 0) {
      showError("الفاتورة فارغة!");
      return;
    }
    const newHeld: HeldInvoice[] = [
      ...heldInvoices,
      { id: crypto.randomUUID(), items: cart, discount, taxRate },
    ];
    setHeldInvoices(newHeld);
    localStorage.setItem("heldInvoices", JSON.stringify(newHeld));
    setCart([]);
    setDiscount(0);
    setSelectedCustomer(null);
  };

  const resumeInvoice = async (index: number) => {
    if (cart.length > 0) {
      const confirmReplace = await showConfirm(
        "فاتورة شغالة",
        "في فاتورة شغالة دلوقتي. عايز تعلّقها الأول وتسترجع الفاتورة المعلقة؟"
      );

      if (!confirmReplace) return;

      const newHeld: HeldInvoice[] = [
        ...heldInvoices,
        { id: crypto.randomUUID(), items: cart, discount, taxRate },
      ];
      localStorage.setItem("heldInvoices", JSON.stringify(newHeld));

      const held = heldInvoices[index];
      setCart(held.items);
      setDiscount(held.discount);
      setTaxRate(held.taxRate);

      const updatedHeld = newHeld.filter((_, i) => i !== index);
      setHeldInvoices(updatedHeld);
      localStorage.setItem("heldInvoices", JSON.stringify(updatedHeld));

      showSuccess("تم تعليق الفاتورة الحالية واسترجاع الفاتورة المعلقة");
      return;
    }

    const held = heldInvoices[index];
    setCart(held.items);
    setDiscount(held.discount);
    setTaxRate(held.taxRate);

    const newHeld = heldInvoices.filter((_, i) => i !== index);
    setHeldInvoices(newHeld);
    localStorage.setItem("heldInvoices", JSON.stringify(newHeld));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showError("الفاتورة فارغة!");
      return;
    }

    setIsCheckingOut(true);
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
          customerId: selectedCustomer?.id || null,
          branchId: branchId,
        }),
      });

      if (res.ok) {
        const invoiceData = await res.json();
        localStorage.setItem("lastInvoice", JSON.stringify({
          ...invoiceData,
          items: cart,
          subTotal,
          discount,
          tax: taxAmount,
          total: finalTotal,
          customerName: selectedCustomer?.name || "عميل نقدي",
        }));

        if (settings?.autoPrintInvoice) {
          window.open("/print", "_blank");
        }

        setCart([]);
        setDiscount(0);
        setSelectedCustomer(null);
        showSuccess("تم إتمام البيع بنجاح!");

        const updatedProducts = await fetch("/api/products").then((r) => r.json());
        setProducts(updatedProducts);

        const initialUnits: Record<number, number> = {};
        (updatedProducts as Product[]).forEach((p) => {
          const units = getAvailableUnits(p);
          const base = units.find((u) => u.isBase) || units[0];
          initialUnits[p.id] = base.id;
        });
        setSelectedUnitByProduct(initialUnits);
      } else {
        showError("حدث خطأ أثناء إتمام البيع");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-pulse-soft">
          <ShoppingCart className="text-primary-500 mx-auto mb-4" size={48} />
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
          {/* Barcode */}
          <div className="bg-primary-50 p-4 rounded-2xl border-2 border-primary-200 mb-4">
            <label className="text-sm font-bold text-primary-800 mb-2 flex items-center gap-2">
              <Barcode size={18} /> المسح السريع (امسح الباركود هنا)
            </label>
            <form onSubmit={handleBarcodeScan}>
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="امسح الباركود..."
                className="w-full border-2 border-primary-300 p-3 rounded-xl focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100 text-lg font-mono bg-[var(--color-card-bg)] transition-all"
                autoFocus
              />
            </form>
            <p className="text-xs text-primary-600 mt-1.5">
              * سيتم إضافة المنتج تلقائياً بمجرد المسح (يدعم باركود الوحدات)
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]" size={20} />
            <input
              type="text"
              placeholder="ابحث بالاسم أو الباركود..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border-2 border-[var(--color-neutral-200)] p-3.5 pr-10 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 text-base transition-all"
            />
          </div>

          {/* Held Invoices */}
          {heldInvoices.length > 0 && (
            <div className="mb-4 p-3 bg-orange-50 rounded-xl border border-orange-200">
              <h3 className="font-bold text-orange-800 mb-2 flex items-center gap-2 text-sm">
                <PauseCircle size={16} /> فواتير معلقة ({heldInvoices.length})
              </h3>
              <div className="flex gap-2 flex-wrap">
                {heldInvoices.map((inv, idx) => (
                  <button
                    key={inv.id}
                    onClick={() => resumeInvoice(idx)}
                    className="bg-orange-200 text-orange-800 px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm font-bold hover:bg-orange-300 active:scale-[0.97] transition-all"
                  >
                    <PlayCircle size={14} /> استرجاع
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto">
            {filteredProducts.map((product) => {
              const units = getAvailableUnits(product);
              const selectedUnitId = selectedUnitByProduct[product.id] ?? units[0].id;
              const selectedUnit = units.find((u) => u.id === selectedUnitId) || units[0];
              const availableQty = Math.floor(product.stock / selectedUnit.factor);
              const isOutOfStock = availableQty === 0;

              return (
                <div
                  key={product.id}
                  className={`bg-[var(--color-bg)] border border-[var(--color-neutral-200)] p-3 rounded-xl flex flex-col gap-2 hover:border-primary-300 hover:shadow-md transition-all ${
                    isOutOfStock ? "opacity-50" : ""
                  }`}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-[var(--color-card-bg)] flex items-center justify-center mb-1.5 border border-[var(--color-card-border)]">
                      <Package className="text-primary-500" size={22} />
                    </div>
                    <div className="font-bold text-sm line-clamp-2 text-[var(--color-fg)]">
                      {product.name}
                    </div>
                    <div className="text-primary-600 font-extrabold text-base mt-1">
                      {selectedUnit.price.toLocaleString("ar-EG")} ج.م
                    </div>
                    <div
                      className={`text-xs mt-0.5 ${
                        availableQty < 5 ? "text-danger-500" : "text-[var(--color-neutral-500)]"
                      }`}
                    >
                      متوفر: {availableQty} {selectedUnit.name}
                    </div>
                  </div>

                  {units.length > 1 && (
                    <select
                      value={selectedUnitId}
                      onChange={(e) =>
                        setSelectedUnitByProduct((prev) => ({
                          ...prev,
                          [product.id]: Number(e.target.value),
                        }))
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="w-full text-xs border border-neutral-300 rounded-lg p-1.5 bg-[var(--color-card-bg)] focus:border-primary-400 focus:outline-none"
                    >
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.price} ج.م)
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    onClick={() => addToCart(product, selectedUnit)}
                    disabled={isOutOfStock}
                    className="w-full bg-primary-500 text-white font-bold py-1.5 rounded-lg hover:bg-primary-600 active:scale-[0.97] transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                  >
                    <Plus size={14} /> إضافة
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Cart */}
        <div className="w-full md:w-96 bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] p-4 flex flex-col">
          <h2 className="text-xl font-extrabold text-[var(--color-fg)] mb-4 flex items-center gap-2 border-b border-[var(--color-card-border)] pb-3">
            <ShoppingCart size={22} className="text-primary-500" /> الفاتورة
          </h2>

          {/* Customer */}
          <div className="mb-4 bg-[var(--color-bg)] p-3 rounded-xl border border-[var(--color-neutral-200)]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-[var(--color-neutral-700)]">العميل</label>
              {!selectedCustomer && (
                <button
                  onClick={quickAddCustomer}
                  className="flex items-center gap-1 text-xs bg-info-500 text-white px-2.5 py-1 rounded-lg hover:opacity-90 transition-all font-bold"
                  title="إضافة عميل جديد"
                >
                  <UserPlus size={12} /> عميل جديد
                </button>
              )}
            </div>
            {selectedCustomer ? (
              <div className="flex items-center justify-between bg-primary-100 px-3 py-2 rounded-lg text-sm text-primary-800">
                <span className="font-bold">
                  {selectedCustomer.name} - {selectedCustomer.phone}
                </span>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-danger-600 hover:bg-danger-50 rounded p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث بالاسم أو رقم التليفون..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full border border-neutral-300 p-2 rounded-lg text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all"
                />
                {customerSearch && (
                  <div className="absolute z-10 w-full bg-[var(--color-card-bg)] border border-[var(--color-neutral-200)] mt-1 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-2 text-sm text-[var(--color-neutral-500)]">لا يوجد عميل مطابق</div>
                    ) : (
                      filteredCustomers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomer(c);
                            setCustomerSearch("");
                          }}
                          className="p-2 text-sm hover:bg-primary-50 cursor-pointer transition-colors"
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

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-2 min-h-0">
            {cart.length === 0 ? (
              <div className="text-center text-[var(--color-neutral-400)] mt-10">
                <ShoppingCart className="mx-auto mb-2 opacity-30" size={48} />
                <p>الفاتورة فارغة</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.key} className="bg-[var(--color-bg)] p-3 rounded-xl border border-[var(--color-card-border)] space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-[var(--color-fg)] truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-primary-600 bg-primary-100 inline-block px-2 py-0.5 rounded mt-1 font-bold">
                        {item.unitName}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.key)}
                      className="text-danger-500 hover:text-danger-700 hover:bg-danger-50 p-1 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-0.5 border border-neutral-300 rounded-lg bg-[var(--color-card-bg)] overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.key, item.quantity - 1)}
                        className="p-1.5 text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)] disabled:opacity-30"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={12} />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.key, Number(e.target.value))}
                        className="w-10 text-center text-sm font-bold border-0 focus:outline-none"
                        min={1}
                        max={item.maxStock}
                      />
                      <button
                        onClick={() => updateQuantity(item.key, item.quantity + 1)}
                        className="p-1.5 text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)] disabled:opacity-30"
                        disabled={item.quantity >= item.maxStock}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-xs text-[var(--color-neutral-400)]">×</span>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updatePrice(item.key, Number(e.target.value))}
                        className="w-16 border border-neutral-300 rounded-lg p-1 text-sm text-left focus:border-primary-400 focus:outline-none"
                        title="يمكنك تعديل السعر"
                      />
                    </div>

                    <div className="font-bold text-primary-600 text-sm whitespace-nowrap">
                      {(item.unitPrice * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals */}
          <div className="border-t border-[var(--color-card-border)] pt-4 mt-auto space-y-2.5">
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
                className="w-24 border border-neutral-300 p-1.5 rounded-lg text-left focus:border-primary-400 focus:outline-none text-sm"
                placeholder="0"
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--color-neutral-600)]">الضريبة (%):</span>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-24 border border-neutral-300 p-1.5 rounded-lg text-left focus:border-primary-400 focus:outline-none text-sm"
              />
            </div>

            <div className="flex justify-between text-sm text-[var(--color-neutral-600)]">
              <span>قيمة الضريبة:</span>
              <span className="font-bold">{taxAmount.toFixed(2)} ج.م</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--color-neutral-600)]">طريقة الدفع:</span>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="border border-neutral-300 p-1.5 rounded-lg text-sm focus:border-primary-400 focus:outline-none"
              >
                <option value="CASH">نقدي</option>
                <option value="CARD">فيزا / بطاقة</option>
              </select>
            </div>

            <div className="flex justify-between text-xl font-extrabold pt-3 border-t border-[var(--color-card-border)]">
              <span>الإجمالي:</span>
              <span className="text-primary-600">{finalTotal.toFixed(2)} ج.م</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={holdInvoice}
                className="w-1/3 bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 active:scale-[0.97] transition-all flex items-center justify-center gap-1.5 text-sm"
              >
                <PauseCircle size={16} /> تعليق
              </button>
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut || cart.length === 0}
                className="w-2/3 bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 active:scale-[0.97] transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm shadow-sm shadow-primary-200"
              >
                <Printer size={16} /> {isCheckingOut ? "جاري..." : "دفع"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}