"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Theme system — single source of truth for light/dark/system.
 *
 * - Preference (`theme`) is what the user picked: "light" | "dark" | "system".
 * - Resolved value (`resolvedTheme`) is the effective rendered palette.
 * - The `dark` class on `<html>` drives Tailwind's class-based dark mode.
 * - Preference is persisted in localStorage under THEME_STORAGE_KEY and is
 *   also read by the bootstrap script (see THEME_BOOTSTRAP_SCRIPT) so the
 *   initial render matches the user's preference and avoids a flash.
 */

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "legal-ai-theme";

type ThemeContextValue = {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (value: ThemePreference) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const isBrowser = () => typeof window !== "undefined";

const readStoredPreference = (): ThemePreference => {
  if (!isBrowser()) return "system";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // localStorage can be unavailable (private mode, blocked cookies, ...).
  }
  return "system";
};

const getSystemTheme = (): ResolvedTheme => {
  if (!isBrowser()) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const applyTheme = (resolved: ResolvedTheme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  // Sync state with what the bootstrap script already applied on the
  // document. Running after hydration avoids mismatched SSR markup.
  useEffect(() => {
    const preference = readStoredPreference();
    const resolved: ResolvedTheme =
      preference === "system" ? getSystemTheme() : preference;
    setThemeState(preference);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  // When the user chose "system", react to OS-level changes live.
  useEffect(() => {
    if (theme !== "system" || !isBrowser()) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handle = (event: MediaQueryListEvent) => {
      const resolved: ResolvedTheme = event.matches ? "dark" : "light";
      setResolvedTheme(resolved);
      applyTheme(resolved);
    };
    media.addEventListener("change", handle);
    return () => media.removeEventListener("change", handle);
  }, [theme]);

  const setTheme = useCallback((value: ThemePreference) => {
    setThemeState(value);
    if (isBrowser()) {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, value);
      } catch {
        // Ignore persistence failures; in-memory state still works.
      }
    }
    const resolved: ResolvedTheme =
      value === "system" ? getSystemTheme() : value;
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a <ThemeProvider>");
  }
  return context;
}

/**
 * Inline script placed in `<head>` so the correct theme is applied BEFORE
 * React hydrates. This prevents a flash of the wrong theme (FOUC) on first
 * paint. Keep the logic in sync with `readStoredPreference` / `applyTheme`.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(() => {
  try {
    var key = ${JSON.stringify(THEME_STORAGE_KEY)};
    var stored = window.localStorage.getItem(key);
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolved = stored === 'light' || stored === 'dark' ? stored : (prefersDark ? 'dark' : 'light');
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    }
    document.documentElement.style.colorScheme = resolved;
  } catch (_) { /* no-op */ }
})();`;
