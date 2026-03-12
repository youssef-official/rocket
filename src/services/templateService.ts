/**
 * Template Service
 * Provides the base Vite project template files that serve as the foundation
 * for all new AI-generated projects. The AI only needs to modify/add files on top of this.
 */

import type { ProjectFile } from '@/types';

// Helper to create a ProjectFile entry
function file(content: string, language: string): ProjectFile {
  return { name: '', path: '', content, language };
}

/**
 * Returns the complete set of template files that form the base of every new project.
 * These files include config, scaffold, UI components, hooks, and utilities.
 */
export function getTemplateFiles(): Record<string, ProjectFile> {
  const files: Record<string, ProjectFile> = {};

  // === Config files ===
  files['index.html'] = file(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>App</title>
    <meta name="description" content="Built with Vivora X" />
    <meta name="author" content="Vivora X" />
    <link rel="icon" type="image/png" href="https://www.vivorax.online/vivora-logo.png" />
    <meta property="og:title" content="App" />
    <meta property="og:description" content="Built with Vivora X" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://vivorax.online/og-image.png" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`, 'html');

  files['package.json'] = file(`{
  "name": "vite_react_shadcn_ts",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "preview": "vite preview"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "^1.2.11",
    "@radix-ui/react-alert-dialog": "^1.1.14",
    "@radix-ui/react-aspect-ratio": "^1.1.7",
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-checkbox": "^1.3.2",
    "@radix-ui/react-collapsible": "^1.1.11",
    "@radix-ui/react-context-menu": "^2.2.15",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-dropdown-menu": "^2.1.15",
    "@radix-ui/react-hover-card": "^1.1.14",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-menubar": "^1.1.15",
    "@radix-ui/react-navigation-menu": "^1.2.13",
    "@radix-ui/react-popover": "^1.1.14",
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-radio-group": "^1.3.7",
    "@radix-ui/react-scroll-area": "^1.2.9",
    "@radix-ui/react-select": "^2.2.5",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slider": "^1.3.5",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.5",
    "@radix-ui/react-tabs": "^1.1.12",
    "@radix-ui/react-toast": "^1.2.14",
    "@radix-ui/react-toggle": "^1.1.9",
    "@radix-ui/react-toggle-group": "^1.1.10",
    "@radix-ui/react-tooltip": "^1.2.7",
    "@tanstack/react-query": "^5.83.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^3.6.0",
    "embla-carousel-react": "^8.6.0",
    "framer-motion": "^12.29.0",
    "input-otp": "^1.4.2",
    "lucide-react": "^0.462.0",
    "next-themes": "^0.3.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.61.1",
    "react-resizable-panels": "^2.1.9",
    "react-router-dom": "^6.30.1",
    "recharts": "^2.15.4",
    "sonner": "^1.7.4",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^0.9.9",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@vitejs/plugin-react-swc": "^3.11.0",
    "autoprefixer": "^10.4.21",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.8.3",
    "vite": "^5.4.19"
  }
}`, 'json');

  files['vite.config.ts'] = file(`import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});`, 'typescript');

  files['tsconfig.json'] = file(`{
  "compilerOptions": {
    "allowJs": true,
    "noImplicitAny": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "paths": { "@/*": ["./src/*"] },
    "skipLibCheck": true,
    "strictNullChecks": false
  },
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}`, 'json');

  files['tsconfig.app.json'] = file(`{
  "compilerOptions": {
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleDetection": "force",
    "moduleResolution": "bundler",
    "noEmit": true,
    "noImplicitAny": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "paths": { "@/*": ["./src/*"] },
    "skipLibCheck": true,
    "strict": false,
    "target": "ES2020",
    "useDefineForClassFields": true
  },
  "include": ["src"]
}`, 'json');

  files['postcss.config.js'] = file(`export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`, 'javascript');

  // === Source files ===
  files['src/main.tsx'] = file(`import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);`, 'typescript');

  files['src/App.tsx'] = file(`import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;`, 'typescript');

  files['src/pages/Index.tsx'] = file(`const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Welcome</h1>
        <p className="text-xl text-muted-foreground">Loading your project...</p>
      </div>
    </div>
  );
};

export default Index;`, 'typescript');

  files['src/pages/NotFound.tsx'] = file(`import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">Return to Home</a>
      </div>
    </div>
  );
};

export default NotFound;`, 'typescript');

  files['src/lib/utils.ts'] = file(`import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`, 'typescript');

  files['src/vite-env.d.ts'] = file(`/// <reference types="vite/client" />`, 'typescript');

  files['src/components/NavLink.tsx'] = file(`import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };`, 'typescript');

  return files;
}

/**
 * Returns the list of ALL template file paths (including UI components).
 * Used to tell the AI what files already exist so it doesn't regenerate them.
 */
export function getTemplateFileList(): string[] {
  return [
    'index.html',
    'package.json',
    'vite.config.ts',
    'tsconfig.json',
    'tsconfig.app.json',
    'postcss.config.js',
    'tailwind.config.ts',
    'src/main.tsx',
    'src/App.tsx',
    'src/App.css',
    'src/index.css',
    'src/vite-env.d.ts',
    'src/lib/utils.ts',
    'src/components/NavLink.tsx',
    'src/pages/Index.tsx',
    'src/pages/NotFound.tsx',
    'src/hooks/use-mobile.tsx',
    'src/hooks/use-toast.ts',
    // UI Components (shadcn)
    'src/components/ui/accordion.tsx',
    'src/components/ui/alert-dialog.tsx',
    'src/components/ui/alert.tsx',
    'src/components/ui/aspect-ratio.tsx',
    'src/components/ui/avatar.tsx',
    'src/components/ui/badge.tsx',
    'src/components/ui/breadcrumb.tsx',
    'src/components/ui/button.tsx',
    'src/components/ui/calendar.tsx',
    'src/components/ui/card.tsx',
    'src/components/ui/carousel.tsx',
    'src/components/ui/chart.tsx',
    'src/components/ui/checkbox.tsx',
    'src/components/ui/collapsible.tsx',
    'src/components/ui/command.tsx',
    'src/components/ui/context-menu.tsx',
    'src/components/ui/dialog.tsx',
    'src/components/ui/drawer.tsx',
    'src/components/ui/dropdown-menu.tsx',
    'src/components/ui/form.tsx',
    'src/components/ui/hover-card.tsx',
    'src/components/ui/input-otp.tsx',
    'src/components/ui/input.tsx',
    'src/components/ui/label.tsx',
    'src/components/ui/menubar.tsx',
    'src/components/ui/navigation-menu.tsx',
    'src/components/ui/pagination.tsx',
    'src/components/ui/popover.tsx',
    'src/components/ui/progress.tsx',
    'src/components/ui/radio-group.tsx',
    'src/components/ui/resizable.tsx',
    'src/components/ui/scroll-area.tsx',
    'src/components/ui/select.tsx',
    'src/components/ui/separator.tsx',
    'src/components/ui/sheet.tsx',
    'src/components/ui/sidebar.tsx',
    'src/components/ui/skeleton.tsx',
    'src/components/ui/slider.tsx',
    'src/components/ui/sonner.tsx',
    'src/components/ui/switch.tsx',
    'src/components/ui/table.tsx',
    'src/components/ui/tabs.tsx',
    'src/components/ui/textarea.tsx',
    'src/components/ui/toast.tsx',
    'src/components/ui/toaster.tsx',
    'src/components/ui/toggle-group.tsx',
    'src/components/ui/toggle.tsx',
    'src/components/ui/tooltip.tsx',
    'src/components/ui/use-toast.ts',
  ];
}
