"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Settings,
  LogOut,
  RotateCcw,
  Menu,
  Database,
} from "lucide-react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Session } from "next-auth";
import ConnectionStatus from "./ConnectionStatus";
import Sidebar from "./Sidebar";
import GlobalSearch from "./GlobalSearch";
import NotificationPoller from "./NotificationPoller";
import ThemeSwitcher from "./ThemeSwitcher";

export default function Header() {
  const { data: session } = useSession();
  const userRole = (session as Session & { user: { role?: string } })?.user?.role;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="bg-[var(--color-card-bg)]/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-primary-100"
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2 group">
            <img
              src="/logo.png"
              alt="Salesaty"
              className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
            />
            <span className="text-xl font-extrabold bg-gradient-to-l from-primary-600 to-primary-400 bg-clip-text text-transparent">
              Salesaty
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-2 font-semibold text-[var(--color-neutral-600)] text-sm">
            {session && (
              <>
                {userRole === "ADMIN" && (
                  <Link
                    href="/admin/dashboard"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:text-primary-600 hover:bg-primary-50 transition"
                  >
                    <LayoutDashboard size={18} /> لوحة التحكم
                  </Link>
                )}
                <Link
                  href="/pos"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:text-primary-600 hover:bg-primary-50 transition"
                >
                  <ShoppingCart size={18} /> الكاشير
                </Link>
                <Link
                  href="/products"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:text-primary-600 hover:bg-primary-50 transition"
                >
                  <Package size={18} /> المنتجات
                </Link>
                <Link
                  href="/returns"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:text-primary-600 hover:bg-primary-50 transition"
                >
                  <RotateCcw size={18} /> المرتجعات
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <GlobalSearch />
            <ConnectionStatus />

            {session && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="text-[var(--color-neutral-500)] hover:text-primary-600 hover:bg-primary-50 transition p-2 rounded-lg"
              >
                <Menu size={22} />
              </button>
            )}

            {userRole === "ADMIN" && <NotificationPoller />}

            {userRole === "ADMIN" && (
              <Link
                href="/settings"
                className="hidden md:block text-[var(--color-neutral-500)] hover:text-primary-600 hover:bg-primary-50 transition p-2 rounded-lg"
                title="الإعدادات"
              >
                <Settings size={22} />
              </Link>
            )}

            {userRole === "ADMIN" && (
              <Link
                href="/backup"
                className="text-[var(--color-neutral-500)] hover:text-primary-600 hover:bg-primary-50 transition p-2 rounded-lg"
                title="النسخ الاحتياطي"
              >
                <Database size={22} />
              </Link>
            )}

            {session && (
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2 bg-danger-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-danger-600 active:scale-[0.97] transition-all"
              >
                <LogOut size={18} /> خروج
              </button>
            )}
          </div>
        </div>
      </motion.header>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
}