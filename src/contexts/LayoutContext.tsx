import React, { createContext, useContext, useState, useEffect } from 'react';

export type LayoutMode = 'classic' | 'macos';

interface LayoutContextType {
  layout: LayoutMode;
  setLayout: (mode: LayoutMode) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

const STORAGE_KEY = 'vivora_layout_mode';

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [layout, setLayoutState] = useState<LayoutMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === 'macos' ? 'macos' : 'classic') as LayoutMode;
  });

  const setLayout = (mode: LayoutMode) => {
    setLayoutState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
    window.dispatchEvent(new Event('vivora-layout-change'));
  };

  return (
    <LayoutContext.Provider value={{ layout, setLayout }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error('useLayout must be used within LayoutProvider');
  return ctx;
};
