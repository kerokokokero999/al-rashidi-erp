"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../components/Header";
import { UserPlus, ArrowRight, Save, User, Phone, Mail } from "lucide-react";
import Link from "next/link";
import { showSuccess, showError } from "@/utils/alerts";

export default function AddCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showSuccess("تم إضافة العميل بنجاح!");
        router.push("/customers");
        router.refresh();
      } else {
        const error = await res.json();
        showError(error.error || "حدث خطأ أثناء الإضافة");
      }
    } catch {
      showError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3 animate-slide-down">
          <Link
            href="/customers"
            className="text-[var(--color-neutral-500)] hover:text-primary-600 hover:bg-primary-50 transition-colors p-2 rounded-lg"
          >
            <ArrowRight size={22} />
          </Link>
          <div className="p-2.5 rounded-xl bg-primary-100">
            <UserPlus className="text-primary-600" size={22} />
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--color-fg)]">إضافة عميل جديد</h1>
        </div>

        {/* Form */}
        <div className="bg-[var(--color-card-bg)] p-6 rounded-2xl shadow-sm border border-[var(--color-card-border)] animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-2 flex items-center gap-1.5">
                <User size={14} className="text-[var(--color-neutral-400)]" /> اسم العميل
              </label>
              <input
                type="text"
                name="name"
                required
                onChange={handleChange}
                className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all"
                placeholder="مثال: أحمد محمد"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-2 flex items-center gap-1.5">
                <Phone size={14} className="text-[var(--color-neutral-400)]" /> رقم التليفون
              </label>
              <input
                type="text"
                name="phone"
                required
                onChange={handleChange}
                className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all text-left"
                placeholder="01xxxxxxxxx"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-2 flex items-center gap-1.5">
                <Mail size={14} className="text-[var(--color-neutral-400)]" /> البريد الإلكتروني (اختياري)
              </label>
              <input
                type="email"
                name="email"
                onChange={handleChange}
                className="w-full border-2 border-[var(--color-neutral-200)] p-3 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all text-left"
                placeholder="email@example.com"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 text-white font-bold py-3.5 rounded-xl hover:bg-primary-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm shadow-primary-200"
            >
              <Save size={18} />
              {loading ? "جاري الحفظ..." : "حفظ العميل"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}