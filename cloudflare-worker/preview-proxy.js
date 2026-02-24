export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, HEAD",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const url = new URL(request.url);
    const hostname = url.hostname;
    const parts = hostname.split(".");
    if (parts.length < 3) {
      return new Response("Invalid subdomain", { status: 400 });
    }
    const subdomain = parts[0];

    if (subdomain === "www" || subdomain === "") {
      return new Response("Not a preview subdomain", { status: 404 });
    }

    // Lookup by subdomain (which is now project_id or sandbox_id)
    // Use ilike for case-insensitive matching
    const lookupUrl = `${env.SUPABASE_URL}/rest/v1/sandbox_mappings?sandbox_id=ilike.${encodeURIComponent(subdomain)}&select=preview_url,api_url`;

    const lookupRes = await fetch(lookupUrl, {
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
      },
    });

    if (!lookupRes.ok) {
      return new Response("Lookup failed", { status: 502 });
    }

    const mappings = await lookupRes.json();
    if (!mappings.length) {
      return new Response(`Sandbox "${subdomain}" not found`, { status: 404 });
    }

    const targetBase = mappings[0].preview_url;
    const targetUrl = targetBase + url.pathname + url.search;

    // WebSocket upgrade for HMR
    if (request.headers.get("Upgrade") === "websocket") {
      return fetch(targetUrl, { headers: request.headers });
    }

    const proxyHeaders = new Headers(request.headers);
    proxyHeaders.set("Host", new URL(targetBase).host);
    proxyHeaders.delete("cf-connecting-ip");
    proxyHeaders.delete("cf-ray");
    proxyHeaders.delete("cf-visitor");

    const proxyResponse = await fetch(targetUrl, {
      method: request.method,
      headers: proxyHeaders,
      body: request.body,
      redirect: "follow",
    });

    const responseHeaders = new Headers(proxyResponse.headers);
    responseHeaders.delete("x-frame-options");
    responseHeaders.delete("X-Frame-Options");
    responseHeaders.delete("content-security-policy");
    responseHeaders.delete("Content-Security-Policy");
    responseHeaders.delete("content-security-policy-report-only");

    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");
    responseHeaders.set("Access-Control-Allow-Headers", "*");
    responseHeaders.set("Content-Security-Policy", "frame-ancestors *");

    return new Response(proxyResponse.body, {
      status: proxyResponse.status,
      statusText: proxyResponse.statusText,
      headers: responseHeaders,
    });
  },
};
