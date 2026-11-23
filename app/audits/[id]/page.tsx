"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "../../../components/Header";
import Link from "next/link";
import { Save, CheckCircle, ArrowRight, ClipboardList } from "lucide-react";
import { showSuccess, showError, showConfirm } from "@/utils/alerts";

type Product = {
  id: number;
  name: string;
  stock: number;
};

type AuditItem = {
  id: number;
  productId: number;
  expectedQty: number;
  actualQty: number;
  difference: number;
  product: Product;
};

type Audit = {
  id: number;
  name: string;
  status: string;
  items: AuditItem[];
};

export default function AuditDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const auditId = Number(params.id);

  const [audit, setAudit] = useState<Audit | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [actualQtys, setActualQtys] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const [auditRes, prodRes] = await Promise.all([
      fetch(`/api/audits/${auditId}`),
      fetch("/api/products"),
    ]);
    if (auditRes.ok) {
      const data = await auditRes.json();
      setAudit(data);
      if (data.items && data.items.length > 0) {
        const initialQtys: Record<number, number> = {};
        data.items.forEach((item: AuditItem) => {
          initialQtys[item.productId] = item.actualQty;
        });
        setActualQtys(initialQtys);
      }
    }
    if (prodRes.ok) setProducts(await prodRes.json());
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [auditId]);

  const handleQtyChange = (productId: number, value: string) => {
    setActualQtys((prev) => ({ ...prev, [productId]: Number(value) }));
  };

  const saveQuantities = async (): Promise<boolean> => {
    const items = products.map((p) => ({
      productId: p.id,
      actualQty: actualQtys[p.id] !== undefined ? actualQtys[p.id] : p.stock,
    }));

    const res = await fetch(`/api/audits/${auditId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    return res.ok;
  };

  const handleSaveAudit = async () => {
    setSaving(true);
    const success = await saveQuantities();
    setSaving(false);
    if (success) {
      showSuccess("تم حفظ الكميات");
      fetchData();
    } else {
      showError("حدث خطأ أثناء الحفظ");
    }
  };

  const handleCloseAudit = async () => {
    const confirmed = await showConfirm(
      "إغلاق الجلسة",
      "هل أنت متأكد من إغلاق الجلسة؟ سيتم تحديث المخزون بالكميات الفعلية."
    );
    if (!confirmed) return;

    setSaving(true);
    const saveSuccess = await saveQuantities();
    if (!saveSuccess) {
      setSaving(false);
      showError("حدث خطأ أثناء حفظ الكميات. الجلسة لم تُغلق.");
      return;
    }

    const res = await fetch(`/api/audits/${auditId}`, { method: "POST" });
    setSaving(false);
    if (res.ok) {
      showSuccess("تم إغلاق الجلسة وتحديث المخزون");
      router.push("/audits");
    } else {
      const errorData = await res.json().catch(() => ({}));
      showError(errorData.error || "حدث خطأ أثناء إغلاق الجلسة");
    }
  };

  if (loading || !audit)
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-pulse-soft">
          <ClipboardList className="text-primary-500 mx-auto mb-4" size={48} />
          <p className="text-[var(--color-neutral-500)] font-bold">جاري التحميل...</p>
        </div>
      </div>
    );

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 animate-slide-down">
          <Link
            href="/audits"
            className="text-[var(--color-neutral-500)] hover:text-primary-600 hover:bg-primary-50 transition-colors p-2 rounded-lg"
          >
            <ArrowRight size={22} />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-[var(--color-fg)]">{audit.name}</h1>
          </div>
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              audit.status === "OPEN"
                ? "bg-warning-500/10 text-orange-700"
                : "bg-success-100 text-success-700"
            }`}
          >
            {audit.status === "OPEN" ? "مفتوحة" : "مكتملة"}
          </span>
        </div>

        {/* Table */}
        <div className="bg-[var(--color-card-bg)] rounded-2xl shadow-sm border border-[var(--color-card-border)] overflow-hidden mb-6 animate-slide-up">
          <table className="w-full text-right text-sm">
            <thead className="bg-[var(--color-bg)] border-b border-[var(--color-card-border)]">
              <tr>
                <th className="p-4 font-bold text-[var(--color-neutral-700)]">المنتج</th>
                <th className="p-4 font-bold text-[var(--color-neutral-700)]">الكمية المتوقعة</th>
                <th className="p-4 font-bold text-[var(--color-neutral-700)]">الكمية الفعلية</th>
                <th className="p-4 font-bold text-[var(--color-neutral-700)]">الفرق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {products.map((product) => {
                const actualQty =
                  actualQtys[product.id] !== undefined ? actualQtys[product.id] : product.stock;
                const difference = actualQty - product.stock;
                return (
                  <tr key={product.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="p-4 font-bold text-[var(--color-fg)]">{product.name}</td>
                    <td className="p-4 text-[var(--color-neutral-600)]">{product.stock}</td>
                    <td className="p-4">
                      <input
                        type="number"
                        value={actualQty}
                        onChange={(e) => handleQtyChange(product.id, e.target.value)}
                        className="w-28 border-2 border-[var(--color-neutral-200)] p-2 rounded-lg text-center focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all disabled:bg-[var(--color-bg)] disabled:cursor-not-allowed"
                        disabled={audit.status === "CLOSED"}
                      />
                    </td>
                    <td className="p-4">
                      <span
                        className={`font-bold px-2.5 py-1 rounded-full text-xs ${
                          difference < 0
                            ? "bg-danger-50 text-danger-700"
                            : difference > 0
                            ? "bg-success-100 text-success-700"
                            : "bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]"
                        }`}
                      >
                        {difference > 0 ? `+${difference}` : difference}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        {audit.status === "OPEN" && (
          <div className="flex gap-3 justify-end flex-wrap animate-slide-up">
            <button
              onClick={handleSaveAudit}
              disabled={saving}
              className="bg-info-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-50"
            >
              <Save size={20} /> {saving ? "جاري..." : "حفظ الكميات"}
            </button>
            <button
              onClick={handleCloseAudit}
              disabled={saving}
              className="bg-success-400 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-success-500 active:scale-[0.97] transition-all disabled:opacity-50 shadow-sm shadow-success-200"
            >
              <CheckCircle size={20} /> إغلاق الجلسة وتحديث المخزون
            </button>
          </div>
        )}
      </main>
    </>
  );
}