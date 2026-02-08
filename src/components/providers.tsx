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

export function useTheme() {
  return useContext(ThemeContext);
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [theme, setThemeState] = useState("default");

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/user/preferences")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.color_theme && data.color_theme !== "default") {
          setThemeState(data.color_theme);
          document.documentElement.setAttribute("data-theme", data.color_theme);
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
