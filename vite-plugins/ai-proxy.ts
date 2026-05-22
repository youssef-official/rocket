/**
 * Custom Vite plugin: in-process AI proxy.
 *
 * Mounts a middleware at `/ai-proxy/<encoded-origin>/<path>` on BOTH the
 * dev server and the preview server. Streams Server-Sent Events back to
 * the browser without buffering, and forwards all headers (including
 * Authorization) untouched. Works for any OpenAI-compatible provider,
 * even ones that don't allow browser CORS (Anthropic, NVIDIA, etc.).
 */
import type { Plugin, ViteDevServer, PreviewServer } from "vite";
import type { IncomingMessage, ServerResponse } from "http";

const PROXY_PREFIX = "/ai-proxy/";

function attach(server: ViteDevServer | PreviewServer) {
  server.middlewares.use(PROXY_PREFIX, async (req: IncomingMessage, res: ServerResponse) => {
    try {
      // req.url here is the path *after* the mount prefix, e.g. "/<encoded-origin>/v1/chat/completions"
      const url = req.url || "";
      const m = url.match(/^\/([^/]+)(\/.*)?$/);
      if (!m) {
        res.statusCode = 400;
        res.end("Bad proxy path");
        return;
      }

      let origin: string;
      try {
        origin = decodeURIComponent(m[1]);
        new URL(origin); // validate
      } catch {
        res.statusCode = 400;
        res.end("Invalid encoded origin");
        return;
      }

      const target = origin.replace(/\/+$/, "") + (m[2] || "/");

      // Collect request body (chunked).
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(c as Buffer);
      const body = chunks.length ? Buffer.concat(chunks) : undefined;

      // Forward headers, drop hop-by-hop and host so fetch sets them correctly.
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(req.headers)) {
        if (!v) continue;
        const key = k.toLowerCase();
        if (["host", "connection", "content-length", "accept-encoding"].includes(key)) continue;
        headers[k] = Array.isArray(v) ? v.join(", ") : String(v);
      }

      const upstream = await fetch(target, {
        method: req.method || "GET",
        headers,
        body: body && body.length ? body : undefined,
        // @ts-ignore — undici duplex flag for streaming requests
        duplex: "half",
      });

      // CORS for the browser.
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");

      // Mirror status + headers (stripping ones Node sets itself).
      res.statusCode = upstream.status;
      upstream.headers.forEach((value, key) => {
        const lk = key.toLowerCase();
        if (["content-encoding", "content-length", "transfer-encoding", "connection"].includes(lk)) return;
        res.setHeader(key, value);
      });

      if (!upstream.body) {
        res.end();
        return;
      }

      // Stream the body straight through (preserves SSE token-by-token).
      const reader = upstream.body.getReader();
      const flush = () => (res as any).flush?.();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          res.write(Buffer.from(value));
          flush();
        }
      }
      res.end();
    } catch (e: any) {
      try {
        res.statusCode = 502;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "ai-proxy failed", message: String(e?.message || e) }));
      } catch {}
    }
  });

  // Preflight handler for OPTIONS at the same prefix.
  server.middlewares.use(PROXY_PREFIX, (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
      res.end();
      return;
    }
    next();
  });
}

export function aiProxyPlugin(): Plugin {
  return {
    name: "vivora-ai-proxy",
    configureServer(server) { attach(server); },
    configurePreviewServer(server) { attach(server); },
  };
}
