/**
 * Cloudflare Worker: Preview Proxy for vivorax.online
 * 
 * This worker proxies requests from {sandbox_id}.vivorax.online 
 * to the actual Modal sandbox preview URL.
 * 
 * Setup:
 * 1. Create a Worker in Cloudflare dashboard
 * 2. Paste this code
 * 3. Add environment variables:
 *    - SUPABASE_URL: your Supabase project URL
 *    - SUPABASE_ANON_KEY: your Supabase anon key
 * 4. Add a wildcard DNS route: *.vivorax.online -> this worker
 * 5. In Workers > Triggers, add route: *.vivorax.online/*
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname;
    
    // Extract sandbox_id from subdomain
    // e.g., "abc123.vivorax.online" -> "abc123"
    const parts = hostname.split('.');
    if (parts.length < 3) {
      return new Response('Invalid subdomain', { status: 400 });
    }
    const sandboxId = parts[0];
    
    // Skip if it's www or root domain
    if (sandboxId === 'www' || sandboxId === '') {
      return new Response('Not a preview subdomain', { status: 404 });
    }

    // Look up the Modal preview URL from Supabase
    const lookupUrl = `${env.SUPABASE_URL}/rest/v1/sandbox_mappings?sandbox_id=eq.${encodeURIComponent(sandboxId)}&select=preview_url`;
    
    const lookupRes = await fetch(lookupUrl, {
      headers: {
        'apikey': env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
      },
    });

    if (!lookupRes.ok) {
      return new Response('Lookup failed', { status: 502 });
    }

    const mappings = await lookupRes.json();
    if (!mappings.length) {
      return new Response(`Sandbox "${sandboxId}" not found`, { status: 404 });
    }

    const targetBase = mappings[0].preview_url;
    // Build the target URL preserving path and query
    const targetUrl = targetBase + url.pathname + url.search;

    // Check for WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return fetch(targetUrl, {
        headers: request.headers,
      });
    }

    // Proxy the request
    const proxyHeaders = new Headers(request.headers);
    proxyHeaders.set('Host', new URL(targetBase).host);
    // Remove cf-* headers that might cause issues
    proxyHeaders.delete('cf-connecting-ip');
    proxyHeaders.delete('cf-ray');
    proxyHeaders.delete('cf-visitor');

    const proxyResponse = await fetch(targetUrl, {
      method: request.method,
      headers: proxyHeaders,
      body: request.body,
      redirect: 'follow',
    });

    // Build response, removing restrictive headers
    const responseHeaders = new Headers(proxyResponse.headers);
    responseHeaders.delete('x-frame-options');
    responseHeaders.delete('content-security-policy');
    // Allow embedding in iframes
    responseHeaders.set('X-Frame-Options', 'ALLOWALL');
    // Set CORS headers
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(proxyResponse.body, {
      status: proxyResponse.status,
      statusText: proxyResponse.statusText,
      headers: responseHeaders,
    });
  },
};
