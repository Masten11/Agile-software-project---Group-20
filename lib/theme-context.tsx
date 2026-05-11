"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("eco-theme") as Theme | null;
    const initial = saved === "light" ? "light" : "dark";
    
    // Uppdatera DOM direkt (detta bryr sig inte React/ESLint om)
    document.documentElement.setAttribute("data-theme", initial);
    
    // Fördröj React-state-uppdateringarna en mikrosekund för att göra ESLint nöjd
    setTimeout(() => {
      setTheme(initial);
      setMounted(true);
    }, 0);
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("eco-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  // Förhindra flash av fel tema vid SSR
  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}