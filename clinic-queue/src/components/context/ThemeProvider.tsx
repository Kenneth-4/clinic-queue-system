"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = "theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    try {
      const stored = (typeof window !== "undefined" && localStorage.getItem(THEME_KEY)) as Theme | null;
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial: Theme = stored ?? (prefersDark ? "dark" : "light");
      applyTheme(initial);
    } catch {
      applyTheme("light");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyTheme = (t: Theme) => {
    setThemeState(t);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (t === "dark") root.classList.add("dark");
      else root.classList.remove("dark");
    }
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {}
  };

  const setTheme = (t: Theme) => applyTheme(t);
  const toggleTheme = () => applyTheme(theme === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}


