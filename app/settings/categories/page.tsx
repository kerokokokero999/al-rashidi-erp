"use client";

import { useState, useEffect } from "react";
import Header from "../../../components/Header";
import { Tags, Plus, Trash2, Ruler, SearchX } from "lucide-react";
import { showSuccess, showError, showConfirm } from "@/utils/alerts";

type Category = { id: number; name: string };
type Unit = { id: number; name: string };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [activeTab, setActiveTab] = useState<"categories" | "units">("categories");
  const [categoryName, setCategoryName] = useState("");
  const [unitName, setUnitName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [catsRes, unitsRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/units"),
      ]);
      if (catsRes.ok) setCategories(await catsRes.json());
      if (unitsRes.ok) setUnits(await unitsRes.json());
    } catch {
      showError("حدث خطأ في جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const addCategory = async () => {
    if (!categoryName) {
      showError("يرجى إدخال اسم القسم");
      return;
    }
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName }),
      });
      if (res.ok) {
        showSuccess("تم إضافة القسم");
        setCategoryName("");
        fetchData();
      } else {
        showError("حدث خطأ (ربما الاسم مسجل)");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    }
  };

  const addUnit = async () => {
    if (!unitName) {
      showError("يرجى إدخال اسم الوحدة");
      return;
    }
    try {
      const res = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: unitName }),
      });
      if (res.ok) {
        showSuccess("تم إضافة الوحدة");
        setUnitName("");
        fetchData();
      } else {
        showError("حدث خطأ (ربما الاسم مسجل)");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    }
  };

  const deleteCategory = async (id: number) => {
    const confirmed = await showConfirm(
      "حذف قسم",
      "هل أنت متأكد من حذف هذا القسم؟ لا يمكن التراجع."
    );
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        showSuccess("تم الحذف");
        fetchData();
      } else {
        showError("حدث خطأ (ربما القسم مرتبط بمنتجات)");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    }
  };

  const deleteUnit = async (id: number) => {
    const confirmed = await showConfirm(
      "حذف وحدة",
      "هل أنت متأكد من حذف هذه الوحدة؟ لا يمكن التراجع."
    );
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/units/${id}`, { method: "DELETE" });
      if (res.ok) {
        showSuccess("تم الحذف");
        fetchData();
      } else {
        showError("حدث خطأ (ربما الوحدة مرتبطة بمنتجات)");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    }
  };

  if (loading)
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-pulse-soft">
          <Tags className="text-primary-500 mx-auto mb-4" size={48} />
          <p className="text-[var(--color-neutral-500)] font-bold">جاري التحميل...</p>
        </div>
      </div>
    );

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-8 animate-slide-down">
          <div className="p-3 rounded-xl bg-primary-100">
            <Tags className="text-primary-600" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">الأقسام والوحدات</h1>
            <p className="text-sm text-[var(--color-neutral-500)] mt-1">
              {categories.length} قسم — {units.length} وحدة
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-[var(--color-card-bg)] p-1.5 rounded-xl border border-[var(--color-card-border)] w-fit">
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-6 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 text-sm ${
              activeTab === "categories"
                ? "bg-primary-500 text-white shadow-sm"
                : "text-[var(--color-neutral-500)] hover:text-primary-600"
            }`}
          >
            <Tags size={18} /> الأقسام ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab("units")}
            className={`px-6 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 text-sm ${
              activeTab === "units"
                ? "bg-primary-500 text-white shadow-sm"
                : "text-[var(--color-neutral-500)] hover:text-primary-600"
            }`}
          >
            <Ruler size={18} /> الوحدات ({units.length})
          </button>
        </div>

        {/* Content */}
        <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] animate-slide-up">
          {activeTab === "categories" ? (
            <>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCategory()}
                  placeholder="اسم القسم الجديد..."
                  className="flex-1 border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all"
                />
                <button
                  onClick={addCategory}
                  className="bg-primary-500 text-white px-6 rounded-xl font-bold hover:bg-primary-600 active:scale-[0.97] transition-all flex items-center gap-2 shadow-sm shadow-primary-200"
                >
                  <Plus size={18} /> إضافة
                </button>
              </div>
              <div className="space-y-2">
                {categories.length === 0 ? (
                  <div className="text-center py-8">
                    <SearchX className="mx-auto text-neutral-300 mb-2" size={40} />
                    <p className="text-[var(--color-neutral-500)] text-sm">لا توجد أقسام.</p>
                  </div>
                ) : (
                  categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex justify-between items-center bg-[var(--color-bg)] p-3 rounded-xl border border-[var(--color-card-border)] hover:bg-primary-50/30 transition-colors"
                    >
                      <span className="font-bold text-[var(--color-fg)]">{cat.name}</span>
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        className="text-danger-500 hover:text-danger-700 p-2 rounded-lg hover:bg-danger-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addUnit()}
                  placeholder="اسم الوحدة الجديدة..."
                  className="flex-1 border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all"
                />
                <button
                  onClick={addUnit}
                  className="bg-primary-500 text-white px-6 rounded-xl font-bold hover:bg-primary-600 active:scale-[0.97] transition-all flex items-center gap-2 shadow-sm shadow-primary-200"
                >
                  <Plus size={18} /> إضافة
                </button>
              </div>
              <div className="space-y-2">
                {units.length === 0 ? (
                  <div className="text-center py-8">
                    <SearchX className="mx-auto text-neutral-300 mb-2" size={40} />
                    <p className="text-[var(--color-neutral-500)] text-sm">لا توجد وحدات.</p>
                  </div>
                ) : (
                  units.map((unit) => (
                    <div
                      key={unit.id}
                      className="flex justify-between items-center bg-[var(--color-bg)] p-3 rounded-xl border border-[var(--color-card-border)] hover:bg-primary-50/30 transition-colors"
                    >
                      <span className="font-bold text-[var(--color-fg)]">{unit.name}</span>
                      <button
                        onClick={() => deleteUnit(unit.id)}
                        className="text-danger-500 hover:text-danger-700 p-2 rounded-lg hover:bg-danger-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}