"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogIn, AlertCircle, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("بيانات الدخول غير صحيحة.");
      setLoading(false);
    } else {
      router.push("/admin/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 px-4 relative overflow-hidden">
      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative max-w-md w-full bg-[var(--color-card-bg)] rounded-3xl shadow-2xl shadow-primary-200/50 p-8 border border-primary-100"
      >
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <motion.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
  className="inline-flex items-center justify-center w-24 h-24 mb-4"
>
  <img
    src="/logo.png"
    alt="Salesaty"
    className="w-full h-full object-contain"
  />
</motion.div>
          <h1 className="text-3xl font-extrabold text-[var(--color-fg)] mb-1">تسجيل الدخول</h1>
          <p className="text-primary-600 font-bold">Salesaty</p>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-danger-50 text-danger-700 p-3 rounded-xl mb-5 flex items-center gap-2 text-sm font-bold border border-danger-200"
          >
            <AlertCircle size={18} className="flex-shrink-0" />
            {error}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-2">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-[var(--color-neutral-200)] p-3.5 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all text-left"
              autoComplete="off"
              dir="ltr"
              required
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--color-neutral-700)] mb-2">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-[var(--color-neutral-200)] p-3.5 rounded-xl focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all text-left pl-12"
                autoComplete="off"
                dir="ltr"
                required
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)] hover:text-primary-500 transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-l from-primary-500 to-primary-600 text-white font-bold py-3.5 rounded-xl hover:from-primary-600 hover:to-primary-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary-200"
          >
            <LogIn size={20} />
            {loading ? "جاري الدخول..." : "دخول"}
          </button>
        </form>

        <p className="text-center text-xs text-[var(--color-neutral-400)] mt-6">
          © 2026 Salesaty — نظام إدارة المبيعات
        </p>
      </motion.div>
    </div>
  );
}