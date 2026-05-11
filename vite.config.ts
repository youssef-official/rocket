import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      // Dynamic AI proxy: /ai-proxy/<encoded-origin>/<path>
      // Example: /ai-proxy/https%3A%2F%2Fintegrate.api.nvidia.com/v1/chat/completions
      "/ai-proxy": {
        target: "https://example.com", // overridden by router
        changeOrigin: true,
        secure: true,
        ws: false,
        router: (req: any) => {
          const m = (req.url || "").match(/^\/ai-proxy\/([^/]+)/);
          try { return m ? decodeURIComponent(m[1]) : "https://example.com"; }
          catch { return "https://example.com"; }
        },
        rewrite: (p: string) => p.replace(/^\/ai-proxy\/[^/]+/, ""),
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
