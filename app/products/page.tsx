
"use client";

import { useState, useEffect } from "react";
import Pagination from "../../components/Pagination";
import Header from "../../components/Header";
import Link from "next/link";
import {
  Package,
  Plus,
  Trash2,
  Edit,
  Search,
  AlertTriangle,
  Barcode,
  Layers,
  TrendingUp,
  QrCode,
} from "lucide-react";
import { showSuccess, showError, showConfirm } from "@/utils/alerts";

type ProductUnit = {
  id: number;
  name: string;
  factor: number;
  price: number;
  isBase: boolean;
};

type ProductStockItem = {
  id: number;
  warehouseId: number;
  stock: number;
  warehouse: { id: number; name: string } | null;
};

type Product = {
  id: number;
  name: string;
  barcode: string | null;
  categoryId: number | null;
  category: { name: string } | null;
  unitId: number | null;
  unit: { name: string } | null;
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  supplier: string | null;
  expiryDate: string | null;
  productUnits: ProductUnit[];
  productStocks: ProductStockItem[];
};

type ProductsSummary = {
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [summary, setSummary] = useState<ProductsSummary>({
    totalProducts: 0,
    totalStockValue: 0,
    lowStockCount: 0,
  });

  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
          search: search.trim(),
        });

        const res = await fetch(
          `/api/products?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          throw new Error("Failed to load products");
        }

        const result = await res.json();

        if (controller.signal.aborted) return;

        const nextTotalPages = Math.max(
          1,
          result.pagination?.totalPages ?? 1
        );

        setTotalItems(result.pagination?.total ?? 0);
        setTotalPages(nextTotalPages);

        if (result.summary) {
          setSummary(result.summary);
        }

        if (page > nextTotalPages) {
          setPage(nextTotalPages);
          return;
        }

        setProducts(
          Array.isArray(result.data) ? result.data : []
        );
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "AbortError"
        ) {
          return;
        }

        showError("حدث خطأ في جلب المنتجات");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    const timer = window.setTimeout(fetchProducts, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [page, pageSize, search, refreshKey]);

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm(
      "حذف منتج",
      "هل أنت متأكد من حذف هذا المنتج نهائياً؟"
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showSuccess("تم حذف المنتج");

        if (products.length === 1 && page > 1) {
          setPage((current) => current - 1);
        } else {
          setRefreshKey((current) => current + 1);
        }
      } else {
        const result = await res.json().catch(() => null);
        showError(result?.error || "حدث خطأ أثناء الحذف");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    }
  };

  if (loading && products.length === 0) {
    return (
      <>
        <Header />
        <div className="text-center py-20">
          <div className="inline-block animate-pulse-soft">
            <Package
              className="text-primary-500 mx-auto mb-4"
              size={48}
            />
            <p className="text-[var(--color-neutral-500)] font-bold">
              جاري التحميل...
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-100">
              <Package className="text-primary-600" size={28} />
            </div>

            <div>
              <h1 className="text-3xl font-extrabold text-[var(--color-fg)]">
                إدارة المنتجات
              </h1>

              <p className="text-sm text-[var(--color-neutral-500)] mt-1">
                {totalItems.toLocaleString("ar-EG")} منتج
                {search.trim() ? " مطابق للبحث" : ""}
                {" — "}
                قيمة المخزون{" "}
                {summary.totalStockValue.toLocaleString("ar-EG")} ج.م
              </p>
            </div>
          </div>

          <Link
            href="/products/add"
            className="bg-primary-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-600 active:scale-[0.97] transition-all shadow-sm shadow-primary-200"
          >
            <Plus size={18} />
            إضافة منتج جديد
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 stagger-children">
          <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-100">
              <Package className="text-primary-600" size={20} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-neutral-500)]">
                إجمالي المنتجات
              </div>
              <div className="text-xl font-extrabold text-[var(--color-fg)]">
                {summary.totalProducts.toLocaleString("ar-EG")}
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success-100">
              <TrendingUp className="text-success-600" size={20} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-neutral-500)]">
                قيمة المخزون
              </div>
              <div className="text-xl font-extrabold text-[var(--color-fg)]">
                {summary.totalStockValue.toLocaleString("ar-EG")} ج.م
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-card-border)] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-danger-50">
              <AlertTriangle className="text-danger-500" size={20} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-neutral-500)]">
                قاربت على النفاذ
              </div>
              <div className="text-xl font-extrabold text-danger-600">
                {summary.lowStockCount.toLocaleString("ar-EG")}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 animate-slide-up">
          <div className="relative max-w-md">
            <Search
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]"
              size={18}
            />

            <input
              type="text"
              placeholder="ابحث بالاسم أو الباركود أو القسم..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full border-2 border-[var(--color-neutral-200)] p-3 pr-10 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all"
            />
          </div>
        </div>

        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] overflow-x-auto animate-slide-up">
          {loading && (
            <div className="h-1 bg-primary-100 overflow-hidden">
              <div className="h-full w-1/3 bg-primary-500 animate-pulse" />
            </div>
          )}

          <table className="w-full text-right whitespace-nowrap">
            <thead className="bg-[var(--color-bg)] text-[var(--color-neutral-600)] text-sm border-b border-[var(--color-card-border)]">
              <tr>
                <th className="p-4 font-bold">المنتج</th>
                <th className="p-4 font-bold">القسم</th>
                <th className="p-4 font-bold">الوحدة</th>
                <th className="p-4 font-bold">الوحدات الفرعية</th>
                <th className="p-4 font-bold">سعر البيع</th>
                <th className="p-4 font-bold">المخزون</th>
                <th className="p-4 font-bold">المورد</th>
                <th className="p-4 font-bold">الصلاحية</th>
                <th className="p-4 font-bold text-center">إجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <Package
                      className="mx-auto text-neutral-300 mb-3"
                      size={48}
                    />
                    <p className="text-[var(--color-neutral-500)]">
                      {search ? "لا توجد نتائج مطابقة." : "لا توجد منتجات حالياً."}
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-primary-50/30 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-bold text-[var(--color-fg)]">
                        {product.name}
                      </div>

                      {product.barcode && (
                        <div className="text-xs text-[var(--color-neutral-400)] inline-flex items-center gap-1 mt-0.5">
                          <Barcode size={12} />
                          {product.barcode}
                        </div>
                      )}
                    </td>

                    <td className="p-4 text-sm text-[var(--color-neutral-600)]">
                      {product.category?.name || "—"}
                    </td>

                    <td className="p-4 text-sm text-[var(--color-neutral-600)]">
                      {product.unit?.name || "—"}
                    </td>

                    <td className="p-4">
                      {product.productUnits && product.productUnits.length > 1 ? (
                        <span className="inline-flex items-center gap-1 bg-info-500/10 text-info-500 px-2 py-1 rounded-lg text-xs font-bold">
                          <Layers size={12} />
                          {product.productUnits.length} وحدات
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--color-neutral-400)]">
                          —
                        </span>
                      )}
                    </td>

                    <td className="p-4 font-bold text-success-600">
                      {product.sellPrice.toLocaleString("ar-EG")} ج.م
                    </td>

                    <td className="p-4">
                      <span
                        className={`font-bold ${
                          product.stock <= product.minStock
                            ? "text-danger-600"
                            : "text-[var(--color-fg)]"
                        }`}
                      >
                        {product.stock}
                      </span>

                      {product.stock <= product.minStock && (
                        <span className="text-xs block text-danger-400">
                          قارب على النفاذ
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-sm text-[var(--color-neutral-500)]">
                      {product.supplier || "—"}
                    </td>

                    <td className="p-4 text-sm text-[var(--color-neutral-500)]">
                      {product.expiryDate
                        ? new Date(product.expiryDate).toLocaleDateString("ar-EG")
                        : "—"}
                    </td>

                    <td className="p-4">
                      <div className="flex justify-center gap-1.5">
                        <Link
                          href={`/products/barcode/${product.id}`}
                          className="p-2 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors"
                          title="طباعة باركود"
                        >
                          <QrCode size={16} />
                        </Link>

                        <Link
                          href={`/products/edit/${product.id}`}
                          className="p-2 bg-info-500/10 text-info-500 rounded-lg hover:bg-info-500/20 transition-colors"
                          title="تعديل"
                        >
                          <Edit size={16} />
                        </Link>

                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 bg-danger-50 text-danger-600 rounded-lg hover:bg-danger-100 transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      </main>
    </>
  );
}