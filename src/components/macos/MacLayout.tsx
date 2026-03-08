import React from 'react';
import { MacDock } from './MacDock';
import { MacMenuBar } from './MacMenuBar';
import { useLocation } from 'react-router-dom';

interface MacLayoutProps {
  children: React.ReactNode;
}

// Pages where we skip the macOS chrome (e.g. login, editor)
const SKIP_PAGES = ['/login', '/get-started'];
const EDITOR_PATTERN = /^\/projects\/[^/]+$/;

export const MacLayout: React.FC<MacLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isSkipped = SKIP_PAGES.includes(location.pathname) || EDITOR_PATTERN.test(location.pathname);

  if (isSkipped) {
    return <>{children}</>;
  }

  return (
    <>
      <MacMenuBar />
      {/* Push content below menu bar and add bottom padding for dock */}
      <div className="pt-7 pb-20 min-h-screen">
        {children}
      </div>
      <MacDock />
    </>
  );
};
