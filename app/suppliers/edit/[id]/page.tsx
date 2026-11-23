"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "../../../../components/Header";
import { Save, ArrowRight, Truck, User, Phone, Mail } from "lucide-react";
import Link from "next/link";
import { showSuccess, showError } from "@/utils/alerts";

export default function EditSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const res = await fetch(`/api/suppliers/${id}`);
        if (res.ok) {
          const data = await res.json();
          setFormData({ name: data.name, phone: data.phone, email: data.email || "" });
        }
      } catch {
        showError("حدث خطأ أثناء جلب البيانات");
      } finally {
        setLoading(false);
      }
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSupplier();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        showSuccess("تم التعديل بنجاح!");
        router.push("/suppliers");
        router.refresh();
      } else {
        showError("حدث خطأ أثناء التعديل");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-pulse-soft">
          <Truck className="text-primary-500 mx-auto mb-4" size={48} />
          <p className="text-[var(--color-neutral-500)] font-bold">جاري التحميل...</p>
        </div>
      </div>
    );

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
        <div className="mb-6 flex items-center gap-3 animate-slide-down">
          <Link
            href="/suppliers"
            className="text-[var(--color-neutral-500)] hover:text-primary-600 hover:bg-primary-50 transition-colors p-2 rounded-lg"
          >
            <ArrowRight size={22} />
          </Link>
          <div className="p-2.5 rounded-xl bg-info-500/10">
            <Truck className="text-info-500" size={22} />
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--color-fg)]">تعديل بيانات المورد</h1>
        </div>

        <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-2 flex items-center gap-1.5">
                <User size={14} className="text-[var(--color-neutral-400)]" /> اسم المورد
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                required
                onChange={handleChange}
                className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-2 flex items-center gap-1.5">
                <Phone size={14} className="text-[var(--color-neutral-400)]" /> رقم التليفون
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                required
                onChange={handleChange}
                className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all text-left"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-2 flex items-center gap-1.5">
                <Mail size={14} className="text-[var(--color-neutral-400)]" /> الإيميل
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all text-left"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-info-500 text-white font-bold py-3.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
              <Save size={18} /> {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}