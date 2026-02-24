const http = require('http');
const httpProxy = require('http-proxy');
const https = require('https');

// === Configuration ===
const PORT = process.env.PORT || 3456;
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const PREVIEW_DOMAIN = process.env.PREVIEW_DOMAIN || 'vivorax.online';

// In-memory cache for sandbox mappings (TTL: 30 seconds)
const cache = new Map();
const CACHE_TTL = 30 * 1000;

// Create proxy server
const proxy = httpProxy.createProxyServer({
  ws: true,
  changeOrigin: true,
  followRedirects: false,
});

// Handle proxy errors gracefully
proxy.on('error', (err, req, res) => {
  console.error(`[Proxy Error] ${err.message}`);
  if (res && res.writeHead) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Sandbox unreachable — it may have expired. Refresh to create a new one.');
  }
});

// Strip iframe-blocking headers from responses
proxy.on('proxyRes', (proxyRes) => {
  delete proxyRes.headers['x-frame-options'];
  delete proxyRes.headers['X-Frame-Options'];
  delete proxyRes.headers['content-security-policy'];
  delete proxyRes.headers['Content-Security-Policy'];
  delete proxyRes.headers['content-security-policy-report-only'];

  proxyRes.headers['access-control-allow-origin'] = '*';
  proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS, HEAD';
  proxyRes.headers['access-control-allow-headers'] = '*';
  proxyRes.headers['content-security-policy'] = 'frame-ancestors *';
});

/**
 * Look up the preview_url for a given subdomain from Supabase
 */
async function lookupPreviewUrl(subdomain) {
  const cached = cache.get(subdomain);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.preview_url;
  }

  const lookupUrl = `${SUPABASE_URL}/rest/v1/sandbox_mappings?sandbox_id=ilike.${encodeURIComponent(subdomain)}&select=preview_url&order=created_at.desc&limit=1`;

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(lookupUrl);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const mappings = JSON.parse(data);
          if (mappings.length > 0 && mappings[0].preview_url) {
            const preview_url = mappings[0].preview_url;
            cache.set(subdomain, { preview_url, timestamp: Date.now() });
            resolve(preview_url);
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Extract subdomain from the Host header
 */
function extractSubdomain(host) {
  if (!host) return null;
  const hostname = host.split(':')[0];
  const domainParts = PREVIEW_DOMAIN.split('.');
  const hostParts = hostname.split('.');

  if (hostParts.length <= domainParts.length) return null;

  const subParts = hostParts.slice(0, hostParts.length - domainParts.length);
  const subdomain = subParts.join('.');

  if (subdomain === 'www' || subdomain === '') return null;
  return subdomain;
}

// Health check endpoint for Render
function isHealthCheck(req) {
  return req.url === '/health' || req.url === '/healthz';
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // Health check for Render
  if (isHealthCheck(req)) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    return;
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return;
  }

  const host = req.headers.host;
  const subdomain = extractSubdomain(host);

  if (!subdomain) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Vivora Preview Proxy</h1><p>Use a subdomain to access a preview.</p>');
    return;
  }

  try {
    const previewUrl = await lookupPreviewUrl(subdomain);

    if (!previewUrl) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`Sandbox "${subdomain}" not found`);
      return;
    }

    proxy.web(req, res, {
      target: previewUrl,
      headers: { Host: new URL(previewUrl).host },
    });
  } catch (err) {
    console.error(`[Lookup Error] ${err.message}`);
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Failed to look up sandbox');
  }
});

// WebSocket upgrade for Vite HMR
server.on('upgrade', async (req, socket, head) => {
  const host = req.headers.host;
  const subdomain = extractSubdomain(host);

  if (!subdomain) { socket.destroy(); return; }

  try {
    const previewUrl = await lookupPreviewUrl(subdomain);
    if (!previewUrl) { socket.destroy(); return; }

    proxy.ws(req, socket, head, {
      target: previewUrl,
      headers: { Host: new URL(previewUrl).host },
    });
  } catch (err) {
    console.error(`[WS Error] ${err.message}`);
    socket.destroy();
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Vivora Preview Proxy running on port ${PORT}`);
  console.log(`   Domain: *.${PREVIEW_DOMAIN}`);
  console.log(`   Supabase: ${SUPABASE_URL ? '✓' : '✗'}`);
});
