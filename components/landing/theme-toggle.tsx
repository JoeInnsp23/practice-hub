"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

/**
 * Floating Theme Toggle
 *
 * A beautiful floating button that:
 * - Toggles between light and dark modes
 * - Persists to localStorage
 * - Positioned as floating button (bottom-right)
 * - Smooth animations
 * - Respects system preferences initially
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  const applyTheme = useCallback((dark: boolean) => {
    const html = document.documentElement;
    if (dark) {
      html.setAttribute("data-theme", "dark");
      html.classList.add("dark");
    } else {
      html.setAttribute("data-theme", "light");
      html.classList.remove("dark");
    }
  }, []);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const shouldUseDark = storedTheme ? storedTheme === "dark" : prefersDark;

    setIsDark(shouldUseDark);
    applyTheme(shouldUseDark);
    setMounted(true);
  }, [applyTheme]);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    applyTheme(newIsDark);
    localStorage.setItem("theme", newIsDark ? "dark" : "light");
  };

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="fixed top-6 right-6 z-40 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="h-5 w-5 transition-transform duration-500 rotate-0 hover:rotate-180" />
      ) : (
        <Moon className="h-5 w-5 transition-transform duration-500 rotate-0 hover:-rotate-180" />
      )}
    </button>
  );
}
