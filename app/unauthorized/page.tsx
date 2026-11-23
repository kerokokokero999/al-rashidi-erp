import Link from "next/link";
import { ShieldAlert, ArrowRight } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 p-4">
      <div className="bg-[var(--color-card-bg)] p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-danger-100 animate-scale-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-danger-50 mb-4">
          <ShieldAlert className="text-danger-500" size={40} />
        </div>
        <h1 className="text-2xl font-extrabold text-[var(--color-fg)] mb-2">
          غير مصرح لك بالدخول
        </h1>
        <p className="text-[var(--color-neutral-500)] mb-6 text-sm">
          عذراً، ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة.
        </p>
        <Link
          href="/pos"
          className="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-600 active:scale-[0.97] transition-all shadow-sm shadow-primary-200"
        >
          <ArrowRight size={18} /> العودة للكاشير
        </Link>
      </div>
    </div>
  );
}