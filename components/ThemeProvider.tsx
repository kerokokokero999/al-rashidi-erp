"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme =
  | "light"
  | "dark"
  | "ocean"
  | "forest"
  | "sunset"
  | "royal"
  | "dark-ocean";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export const themes: { value: Theme; label: string; icon: string; preview: string }[] = [
  { value: "ocean", label: "محيط (الافتراضي)", icon: "🌊", preview: "#3B82F6" },
  { value: "light", label: "وردي", icon: "🌸", preview: "#FA699E" },
  { value: "dark", label: "ليلي", icon: "🌙", preview: "#FA699E" },
  { value: "forest", label: "غابة", icon: "🌲", preview: "#22C55E" },
  { value: "sunset", label: "غروب", icon: "🌅", preview: "#F97316" },
  { value: "royal", label: "ملكي", icon: "👑", preview: "#A855F7" },
  { value: "dark-ocean", label: "ليلي محيط", icon: "🌌", preview: "#3B82F6" },
];

const STORAGE_KEY = "salesaty-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  // ✅ lazy initializer — يقرأ من localStorage مرة واحدة عند أول render
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (saved && themes.some((t) => t.value === saved)) {
        return saved;
      }
      return "light";
    } catch {
      return "light";
    }
  });

  // ✅ تطبيق الثيم + حفظه في localStorage
  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (err) {
      console.error("Theme error:", err);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}