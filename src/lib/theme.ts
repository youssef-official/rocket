export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "rocket_theme_preference";
const CHANGE_EVENT = "rocket-theme-change";

export function getStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === "light" || v === "dark" || v === "system") return v;
  return "system";
}

export function applyTheme(theme: ThemePreference) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
  const shouldUseDark = theme === "dark" || (theme === "system" && prefersDark);
  root.classList.toggle("dark", shouldUseDark);
}

export function setStoredTheme(theme: ThemePreference) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function onThemeChange(handler: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

export function cycleTheme(theme: ThemePreference): ThemePreference {
  if (theme === "dark") return "light";
  if (theme === "light") return "system";
  return "dark";
}
