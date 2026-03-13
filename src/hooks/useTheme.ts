import { useTheme as useNextTheme } from "next-themes";
import type { Theme } from "@/lib/theme";

/**
 * ASCO Design System — Theme Hook
 * Typed wrapper around next-themes.
 */
export function useTheme() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextTheme();

  return {
    /** Current theme setting: "light" | "dark" | "system" */
    theme: (theme ?? "system") as Theme,
    /** Resolved theme after system preference: "light" | "dark" */
    resolvedTheme: (resolvedTheme ?? "light") as "light" | "dark",
    /** System preference */
    systemTheme: (systemTheme ?? "light") as "light" | "dark",
    /** Whether dark mode is active */
    isDark: resolvedTheme === "dark",
    /** Whether light mode is active */
    isLight: resolvedTheme === "light",
    /** Set theme explicitly */
    setTheme: (t: Theme) => setTheme(t),
    /** Toggle between light and dark */
    toggleTheme: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
  };
}
