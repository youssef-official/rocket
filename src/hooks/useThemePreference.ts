import { useEffect, useMemo, useState } from "react";
import {
  ThemePreference,
  applyTheme,
  cycleTheme,
  getStoredTheme,
  onThemeChange,
  setStoredTheme,
} from "@/lib/theme";

export function useThemePreference() {
  const [theme, setThemeState] = useState<ThemePreference>(() => getStoredTheme());

  useEffect(() => {
    // Apply immediately whenever local state changes
    setStoredTheme(theme);
  }, [theme]);

  useEffect(() => {
    // Keep in sync across components/tabs
    const sync = () => {
      const next = getStoredTheme();
      setThemeState((prev) => (prev === next ? prev : next));
    };

    const offCustom = onThemeChange(sync);
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === "rocket_theme_preference") sync();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      offCustom();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const cycle = useMemo(() => {
    return () => setThemeState((prev) => cycleTheme(prev));
  }, []);

  return {
    theme,
    setTheme: setThemeState,
    cycleTheme: cycle,
  };
}
