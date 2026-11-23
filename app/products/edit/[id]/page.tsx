"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "../../../../components/Header";
import { Save, ArrowRight, Upload, X, Plus, Truck, Layers, Trash2, Warehouse, Package } from "lucide-react";
import Link from "next/link";
import { showSuccess, showError, showInput } from "@/utils/alerts";

type Category = { id: number; name: string };
type Unit = { id: number; name: string };
type Warehouse = { id: number; name: string };
type Supplier = { id: number; name: string; phone: string };

type ProductUnitDraft = {
  name: string;
  factor: number;
  price: number;
  barcode: string;
  isBase: boolean;
};

type WarehouseStockDraft = {
  warehouseId: number;
  stock: number;
  purchasePrice: number;
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    categoryId: "",
    unitId: "",
    costPrice: "",
    sellPrice: "",
    stock: "",
    minStock: "5",
    supplier: "",
    expiryDate: "",
    image: "",
  });

  const [productUnits, setProductUnits] = useState<ProductUnitDraft[]>([]);
  const [warehouseStocks, setWarehouseStocks] = useState<WarehouseStockDraft[]>([]);

  const fetchAllData = async () => {
    try {
      const [productRes, catsRes, unitsRes, warehousesRes, suppliersRes] = await Promise.all([
        fetch(`/api/products/${id}`),
        fetch("/api/categories"),
        fetch("/api/units"),
        fetch("/api/warehouses"),
        fetch("/api/suppliers"),
      ]);

      if (productRes.ok) {
        const data = await productRes.json();
        setFormData({
          name: data.name,
          barcode: data.barcode || "",
          categoryId: data.categoryId?.toString() || "",
          unitId: data.unitId?.toString() || "",
          costPrice: data.costPrice.toString(),
          sellPrice: data.sellPrice.toString(),
          stock: data.stock.toString(),
          minStock: data.minStock.toString(),
          supplier: data.supplier || "",
          expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString().split("T")[0] : "",
          image: data.image || "",
        });

        if (data.productUnits && data.productUnits.length > 0) {
          setProductUnits(
            data.productUnits.map((u: {
              name: string; factor: number; price: number; barcode: string | null; isBase: boolean;
            }) => ({
              name: u.name,
              factor: u.factor,
              price: u.price,
              barcode: u.barcode || "",
              isBase: u.isBase,
            }))
          );
        } else {
          setProductUnits([{ name: "", factor: 1, price: 0, barcode: "", isBase: true }]);
        }

        // ✅ تحميل كميات المخازن
        if (data.productStocks && Array.isArray(data.productStocks)) {
          const stocksMap: Record<number, { stock: number; purchasePrice: number }> = {};
          data.productStocks.forEach((ps: {
            warehouseId: number; stock: number; purchasePrice: number;
          }) => {
            stocksMap[ps.warehouseId] = {
              stock: ps.stock,
              purchasePrice: ps.purchasePrice || 0,
            };
          });
          setWarehouseStocks(
            Object.entries(stocksMap).map(([wid, val]) => ({
              warehouseId: Number(wid),
              stock: val.stock,
              purchasePrice: val.purchasePrice,
            }))
          );
        }
      }

      if (catsRes.ok) setCategories(await catsRes.json());
      if (unitsRes.ok) setUnits(await unitsRes.json());
      if (suppliersRes.ok) setSuppliers(await suppliersRes.json());
      if (warehousesRes.ok) {
        const warehousesData = await warehousesRes.json();
        setWarehouses(warehousesData);

        // لو مفيش stocks موجودة، ابدأ من الصفر لكل مخزن
        setWarehouseStocks((prev) => {
          if (prev.length === 0) {
            return warehousesData.map((w: Warehouse) => ({
              warehouseId: w.id,
              stock: 0,
              purchasePrice: 0,
            }));
          }
          // أضف المخازن الجديدة اللي مش موجودة
          const existingIds = new Set(prev.map((p) => p.warehouseId));
          const missing = warehousesData
            .filter((w: Warehouse) => !existingIds.has(w.id))
            .map((w: Warehouse) => ({
              warehouseId: w.id,
              stock: 0,
              purchasePrice: 0,
            }));
          return [...prev, ...missing];
        });
      }
    } catch {
      showError("حدث خطأ في جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const json = await res.json();
      if (res.ok) setFormData((prev) => ({ ...prev, image: json.url }));
      else showError("حدث خطأ أثناء رفع الصورة");
    } catch {
      showError("حدث خطأ في الاتصال");
    } finally {
      setUploading(false);
    }
  };

  const addNewSupplier = async () => {
    const name = await showInput("إضافة مورد جديد", "اسم المورد");
    if (!name) return;
    const phone = await showInput("إضافة مورد جديد", "رقم التليفون");
    if (!phone) return;
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      if (res.ok) {
        const newSupplier = await res.json();
        showSuccess("تم إضافة المورد");
        setSuppliers((prev) => [...prev, newSupplier]);
        setFormData((prev) => ({ ...prev, supplier: newSupplier.name }));
      } else showError("الرقم مسجل بالفعل أو حدث خطأ");
    } catch {
      showError("حدث خطأ في الاتصال");
    }
  };

  const addNewCategory = async () => {
    const name = await showInput("إضافة قسم جديد", "اسم القسم");
    if (!name) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        showSuccess("تم إضافة القسم");
        const newCat = await res.json();
        setCategories((prev) => [...prev, newCat]);
      } else showError("حدث خطأ (ربما الاسم مسجل)");
    } catch {
      showError("حدث خطأ في الاتصال");
    }
  };

  const addNewUnit = async () => {
    const name = await showInput("إضافة وحدة جديدة", "اسم الوحدة");
    if (!name) return;
    try {
      const res = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        showSuccess("تم إضافة الوحدة");
        const newUnit = await res.json();
        setUnits((prev) => [...prev, newUnit]);
      } else showError("حدث خطأ (ربما الاسم مسجل)");
    } catch {
      showError("حدث خطأ في الاتصال");
    }
  };

  const addProductUnit = () => {
    setProductUnits((prev) => [
      ...prev,
      { name: "", factor: 1, price: 0, barcode: "", isBase: false },
    ]);
  };

  const updateProductUnit = (
    index: number,
    field: keyof ProductUnitDraft,
    value: string | number | boolean
  ) => {
    setProductUnits((prev) =>
      prev.map((u, i) => (i === index ? { ...u, [field]: value } : u))
    );
  };

  const removeProductUnit = (index: number) => {
    setProductUnits((prev) => prev.filter((_, i) => i !== index));
  };

  const setBaseUnit = (index: number) => {
    setProductUnits((prev) => prev.map((u, i) => ({ ...u, isBase: i === index })));
  };

  const updateWarehouseStock = (
    warehouseId: number,
    field: keyof WarehouseStockDraft,
    value: number
  ) => {
    setWarehouseStocks((prev) =>
      prev.map((w) =>
        w.warehouseId === warehouseId ? { ...w, [field]: value } : w
      )
    );
  };

  const totalStockFromWarehouses = warehouseStocks.reduce(
    (sum, w) => sum + (w.stock || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const cleanedUnits = productUnits
      .filter((u) => u.name.trim() !== "")
      .map((u) => ({
        name: u.name.trim(),
        factor: Number(u.factor) || 1,
        price: Number(u.price) || 0,
        barcode: u.barcode || undefined,
        isBase: u.isBase,
      }));

    const finalStock = totalStockFromWarehouses || Number(formData.stock) || 0;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          stock: finalStock,
          warehouseStocks: warehouseStocks.filter((w) => w.stock > 0),
          productUnits: cleanedUnits,
        }),
      });
      if (res.ok) {
        showSuccess("تم تعديل المنتج بنجاح!");
        router.push("/products");
        router.refresh();
      } else showError("حدث خطأ أثناء التعديل.");
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
          <Package className="text-primary-500 mx-auto mb-4" size={48} />
          <p className="text-[var(--color-neutral-500)] font-bold">جاري التحميل...</p>
        </div>
      </div>
    );

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <div className="mb-6 flex items-center gap-3 animate-slide-down">
          <Link
            href="/products"
            className="text-[var(--color-neutral-500)] hover:text-primary-600 hover:bg-primary-50 transition-colors p-2 rounded-lg"
          >
            <ArrowRight size={22} />
          </Link>
          <div className="p-2.5 rounded-xl bg-info-500/10">
            <Package className="text-info-500" size={22} />
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--color-fg)]">تعديل بيانات المنتج</h1>
        </div>

        <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] animate-slide-up">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-2">اسم المنتج</label>
              <input type="text" name="name" value={formData.name} required onChange={handleChange} className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all" />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-2">الباركود</label>
              <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-2">القسم</label>
              <div className="flex gap-2">
                <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="flex-1 border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none">
                  <option value="">اختر القسم</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <button type="button" onClick={addNewCategory} className="bg-primary-100 text-primary-700 px-3 rounded-xl hover:bg-primary-200 transition" title="إضافة قسم جديد">
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-2">وحدة القياس الأساسية</label>
              <div className="flex gap-2">
                <select name="unitId" value={formData.unitId} onChange={handleChange} className="flex-1 border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none">
                  <option value="">اختر الوحدة</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                  ))}
                </select>
                <button type="button" onClick={addNewUnit} className="bg-primary-100 text-primary-700 px-3 rounded-xl hover:bg-primary-200 transition" title="إضافة وحدة جديدة">
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-2 flex items-center gap-1">
                <Truck size={16} /> المورد
              </label>
              <div className="flex gap-2">
                <select name="supplier" value={formData.supplier} onChange={handleChange} className="flex-1 border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none">
                  <option value="">اختر المورد</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.name}>{sup.name} - {sup.phone}</option>
                  ))}
                </select>
                <button type="button" onClick={addNewSupplier} className="bg-primary-100 text-primary-700 px-3 rounded-xl hover:bg-primary-200 transition" title="إضافة مورد جديد">
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-2">سعر الشراء (التكلفة)</label>
              <input type="number" name="costPrice" value={formData.costPrice} required onChange={handleChange} className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-2">سعر البيع الأساسي</label>
              <input type="number" name="sellPrice" value={formData.sellPrice} required onChange={handleChange} className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-2">حد التنبيه (الحد الأدنى)</label>
              <input type="number" name="minStock" value={formData.minStock} onChange={handleChange} className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none" />
            </div>

            <div className="md:col-span-2 border-t border-[var(--color-card-border)] pt-4 mt-2">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-[var(--color-neutral-700)] flex items-center gap-2">
                  <Layers size={18} className="text-primary-500" /> وحدات البيع المتعددة
                </label>
                <button type="button" onClick={addProductUnit} className="bg-info-500/10 text-info-500 px-3 py-1.5 rounded-lg hover:bg-info-500/20 transition text-sm font-bold flex items-center gap-1">
                  <Plus size={14} /> إضافة وحدة
                </button>
              </div>
              <div className="space-y-2">
                {productUnits.map((unit, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end bg-[var(--color-bg)] p-3 rounded-xl border border-[var(--color-neutral-200)]">
                    <div className="col-span-12 sm:col-span-3">
                      <label className="block text-xs text-[var(--color-neutral-600)] mb-1">اسم الوحدة</label>
                      <input type="text" value={unit.name} onChange={(e) => updateProductUnit(index, "name", e.target.value)} className="w-full border border-neutral-300 p-2 rounded-lg text-sm focus:border-primary-400 focus:outline-none" />
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                      <label className="block text-xs text-[var(--color-neutral-600)] mb-1">المعامل</label>
                      <input type="number" value={unit.factor} onChange={(e) => updateProductUnit(index, "factor", Number(e.target.value))} min={1} className="w-full border border-neutral-300 p-2 rounded-lg text-sm focus:border-primary-400 focus:outline-none" />
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                      <label className="block text-xs text-[var(--color-neutral-600)] mb-1">السعر</label>
                      <input type="number" value={unit.price} onChange={(e) => updateProductUnit(index, "price", Number(e.target.value))} className="w-full border border-neutral-300 p-2 rounded-lg text-sm focus:border-primary-400 focus:outline-none" />
                    </div>
                    <div className="col-span-8 sm:col-span-3">
                      <label className="block text-xs text-[var(--color-neutral-600)] mb-1">باركود</label>
                      <input type="text" value={unit.barcode} onChange={(e) => updateProductUnit(index, "barcode", e.target.value)} className="w-full border border-neutral-300 p-2 rounded-lg text-sm focus:border-primary-400 focus:outline-none" />
                    </div>
                    <div className="col-span-4 sm:col-span-2 flex items-center justify-end gap-1">
                      <button type="button" onClick={() => setBaseUnit(index)} className={`px-2 py-2 rounded-lg text-xs font-bold ${unit.isBase ? "bg-success-500 text-white" : "bg-neutral-200 text-[var(--color-neutral-700)]"}`}>
                        {unit.isBase ? "أساسية ✓" : "أساسية"}
                      </button>
                      <button type="button" onClick={() => removeProductUnit(index)} disabled={productUnits.length === 1} className="text-danger-500 hover:text-danger-700 disabled:opacity-30 p-2">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {warehouses.length > 0 && (
              <div className="md:col-span-2 border-t border-[var(--color-card-border)] pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-[var(--color-neutral-700)] flex items-center gap-2">
                    <Warehouse size={18} className="text-primary-500" /> كميات المخازن
                  </label>
                  <span className="text-xs bg-success-100 text-success-700 px-2.5 py-1 rounded-lg font-bold">
                    الإجمالي: {totalStockFromWarehouses} وحدة
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {warehouses.map((wh) => {
                    const ws = warehouseStocks.find((w) => w.warehouseId === wh.id);
                    return (
                      <div key={wh.id} className="bg-[var(--color-bg)] p-3 rounded-xl border border-[var(--color-neutral-200)]">
                        <div className="text-sm font-bold text-[var(--color-neutral-700)] mb-2">{wh.name}</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-[var(--color-neutral-500)] mb-1">الكمية</label>
                            <input type="number" value={ws?.stock || 0} onChange={(e) => updateWarehouseStock(wh.id, "stock", Number(e.target.value))} className="w-full border border-neutral-300 p-2 rounded-lg text-sm focus:border-primary-400 focus:outline-none" />
                          </div>
                          <div>
                            <label className="block text-xs text-[var(--color-neutral-500)] mb-1">سعر الشراء</label>
                            <input type="number" value={ws?.purchasePrice || 0} onChange={(e) => updateWarehouseStock(wh.id, "purchasePrice", Number(e.target.value))} className="w-full border border-neutral-300 p-2 rounded-lg text-sm focus:border-primary-400 focus:outline-none" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-2">تاريخ الصلاحية (اختياري)</label>
              <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-2">صورة المنتج</label>
              <div className="flex gap-3 items-center">
                <input type="text" name="image" value={formData.image} onChange={handleChange} placeholder="أدخل رابط الصورة هنا..." className="flex-1 border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none" />
                <label className="bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)] px-4 py-3 rounded-xl cursor-pointer hover:bg-neutral-200 transition flex items-center gap-2 font-bold text-sm">
                  <Upload size={18} /> رفع صورة
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              {uploading && <p className="text-sm text-info-500 mt-2">جاري رفع الصورة...</p>}
              {formData.image && (
                <div className="mt-4 relative inline-block">
                  <img src={formData.image} alt="Product" className="w-32 h-32 object-cover rounded-xl border border-[var(--color-neutral-200)]" />
                  <button type="button" onClick={() => setFormData({ ...formData, image: "" })} className="absolute -top-2 -right-2 bg-danger-500 text-white rounded-full p-1">
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            <button type="submit" disabled={saving || uploading} className="md:col-span-2 bg-info-500 text-white font-bold py-4 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm">
              <Save size={20} />
              {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}