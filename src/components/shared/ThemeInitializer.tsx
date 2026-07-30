import React, { useEffect } from "react";
import { setStoredTheme } from "@/lib/theme";

export const ThemeInitializer: React.FC = () => {
  useEffect(() => {
    setStoredTheme('dark');
  }, []);

  return null;
};
