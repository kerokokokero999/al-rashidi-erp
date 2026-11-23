"use client";

import { useState, useRef, useEffect } from "react";
import { Palette, Check, X } from "lucide-react";
import { useTheme, themes, Theme } from "./ThemeProvider";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentTheme = themes.find((t) => t.value === theme) || themes[0];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-[var(--color-neutral-500)] hover:text-primary-600 hover:bg-primary-50 transition p-2 rounded-lg"
        title="تغيير الثيم"
      >
        <Palette size={22} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-12 w-64 bg-[var(--color-card-bg)] rounded-2xl shadow-2xl border border-[var(--color-neutral-200)] z-[100] animate-scale-in overflow-hidden">
          <div className="p-3 border-b border-[var(--color-card-border)] flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-[var(--color-fg)]">
              اختر الثيم
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-[var(--color-neutral-400)] hover:text-danger-600"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-2 max-h-80 overflow-y-auto">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setTheme(t.value as Theme);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-right transition-colors ${
                  theme === t.value
                    ? "bg-primary-50 border-2 border-primary-300"
                    : "hover:bg-[var(--color-bg)] border-2 border-transparent"
                }`}
              >
                <span className="text-xl">{t.icon}</span>
                <span className="flex-1 font-bold text-sm text-[var(--color-fg)]">
                  {t.label}
                </span>
                <span
                  className="w-6 h-6 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: t.preview }}
                />
                {theme === t.value && (
                  <Check size={16} className="text-primary-600" />
                )}
              </button>
            ))}
          </div>
          <div className="p-2 border-t border-[var(--color-card-border)] text-xs text-center text-[var(--color-neutral-500)]">
            الثيم الحالي: <strong>{currentTheme.label}</strong>
          </div>
        </div>
      )}
    </div>
  );
}