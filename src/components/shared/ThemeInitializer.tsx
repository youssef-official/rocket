import React, { useEffect } from "react";
import { applyTheme, getStoredTheme } from "@/lib/theme";

export const ThemeInitializer: React.FC = () => {
  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  return null;
};
