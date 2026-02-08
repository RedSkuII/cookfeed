"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

type ThemeContextType = {
  theme: string;
  setTheme: (theme: string) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "default",
  setTheme: () => {},
});

const THEME_COLORS: Record<string, string> = {
  default: "#ee751d",
  ocean: "#2563eb",
  berry: "#9333ea",
  forest: "#059669",
  sunset: "#e11d48",
  lavender: "#6366f1",
};

function updateMetaThemeColor(color: string) {
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", color);
}

export function useTheme() {
  return useContext(ThemeContext);
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [theme, setThemeState] = useState("default");

  useEffect(() => {
    updateMetaThemeColor(THEME_COLORS.default);
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/user/preferences")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.color_theme && data.color_theme !== "default") {
          setThemeState(data.color_theme);
          document.documentElement.setAttribute("data-theme", data.color_theme);
          updateMetaThemeColor(THEME_COLORS[data.color_theme] || THEME_COLORS.default);
        }
      })
      .catch(() => {});
  }, [session?.user]);

  const setTheme = useCallback((newTheme: string) => {
    setThemeState(newTheme);
    if (newTheme === "default") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", newTheme);
    }
    updateMetaThemeColor(THEME_COLORS[newTheme] || THEME_COLORS.default);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  );
}
