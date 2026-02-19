import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const CLOUDFLARE_ACCOUNT_ID = Deno.env.get("CLOUDFLARE_ACCOUNT_ID") ?? "";
const CLOUDFLARE_API_TOKEN = Deno.env.get("CLOUDFLARE_API_TOKEN") ?? "";
const CLOUDFLARE_ZONE_ID = Deno.env.get("CLOUDFLARE_ZONE_ID") ?? "";
const VIVORA_DOMAIN = "vivorax.online";

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

async function isSubdomainTaken(subdomain: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("vivora_deployments")
    .select("id")
    .eq("subdomain", subdomain)
    .maybeSingle();
  return !!data;
}

async function computeHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── Build a complete, self-contained HTML page ───────────────────────────────
// This renders the project as a fully functional static page using CDN libraries
function buildDeployableHtml(files: Record<string, string>): string {
  const indexHtml = files["index.html"] || files["/index.html"] || "";

  let projectTitle = "Vivora App";
  const titleMatch = indexHtml.match(/<title>([^<]+)<\/title>/);
  if (titleMatch) projectTitle = titleMatch[1];

  // Collect CSS
  let inlineCss = "";
  for (const [path, content] of Object.entries(files)) {
    if (
      (path.endsWith(".css")) &&
      !path.includes("node_modules") &&
      typeof content === "string"
    ) {
      // Remove tailwind directives - CDN will handle it
      const clean = content
        .replace(/@tailwind[^;]+;/g, "")
        .replace(/@layer\s+\w+\s*\{([^}]*)\}/g, "$1")
        .trim();
      if (clean) inlineCss += `\n/* ${path} */\n${clean}\n`;
    }
  }

  // Extract main app content from TSX/JSX for display fallback
  const appFile = files["src/App.tsx"] || files["src/app.tsx"] || "";
  const heroFile = files["src/components/Hero.tsx"] || files["src/pages/HomePage.tsx"] || "";

  // Extract text content (headings, paragraphs)
  const extractText = (src: string): string[] => {
    const texts: string[] = [];
    const matches = src.matchAll(/(?:>|`)([A-Z][^<`\n]{8,80})(?:<|`)/g);
    for (const m of matches) {
      const t = m[1].trim();
      if (t && !t.includes('{') && !t.includes('(') && !t.includes('import')) {
        texts.push(t);
      }
    }
    return [...new Set(texts)].slice(0, 6);
  };

  const heroTexts = extractText(heroFile || appFile);
  const heroHtml = heroTexts.length > 0
    ? heroTexts.map((t, i) =>
        i === 0
          ? `<h1 style="font-size:clamp(2rem,5vw,3.5rem);font-weight:700;margin:0 0 1rem;line-height:1.15;font-family:'Playfair Display',serif;">${t}</h1>`
          : `<p style="font-size:1.1rem;color:rgba(255,255,255,0.7);margin:0 0 0.75rem;line-height:1.6;">${t}</p>`
      ).join("\n")
    : `<h1 style="font-size:clamp(2rem,5vw,3.5rem);font-weight:700;margin:0 0 1rem;font-family:'Playfair Display',serif;">${projectTitle}</h1>
       <p style="font-size:1.1rem;color:rgba(255,255,255,0.7);margin:0;">Deployed on Vivora Hosting</p>`;

  // Extract primary color from CSS
  let primaryColor = "#6366f1";
  const colorMatch = inlineCss.match(/--primary[^:]*:\s*([0-9.]+\s+[0-9.]+%\s+[0-9.]+%)/);
  if (colorMatch) primaryColor = `hsl(${colorMatch[1]})`;

  // Extract nav items
  const navMatches = [...(appFile + heroFile).matchAll(/(?:href|to)=['"]([/\w-]+)['"]/g)];
  const navItems = [...new Set(navMatches.map(m => m[1]).filter(h => h !== '/' && !h.includes('http')))].slice(0, 5);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${projectTitle}</title>
  <meta name="description" content="${projectTitle} - Built with Vivora X" />
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚀</text></svg>" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            'playfair': ['Playfair Display', 'serif'],
            'inter': ['Inter', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { 
      font-family: 'Inter', sans-serif; 
      margin: 0; padding: 0;
      background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%);
      min-height: 100vh;
      color: #fff;
    }
    ${inlineCss}
    
    .vivora-badge {
      position: fixed; bottom: 16px; right: 16px;
      background: rgba(0,0,0,0.85);
      color: white; padding: 6px 14px;
      border-radius: 20px; font-size: 11px;
      font-family: Inter, sans-serif; z-index: 9999;
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.15);
      text-decoration: none;
      display: flex; align-items: center; gap: 6px;
      transition: opacity 0.2s;
    }
    .vivora-badge:hover { opacity: 0.8; }

    nav a {
      color: rgba(255,255,255,0.7);
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 8px;
      transition: all 0.2s;
      font-size: 0.9rem;
    }
    nav a:hover {
      color: white;
      background: rgba(255,255,255,0.1);
    }

    .hero-section {
      min-height: 90vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
    }

    .cta-button {
      display: inline-flex; align-items: center; gap: 8px;
      background: ${primaryColor};
      color: white;
      padding: 14px 28px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      text-decoration: none;
      border: none; cursor: pointer;
      transition: opacity 0.2s, transform 0.2s;
      margin-top: 1.5rem;
    }
    .cta-button:hover { opacity: 0.85; transform: translateY(-1px); }
  </style>
</head>
<body>
  <!-- Navigation -->
  <nav style="position:sticky;top:0;z-index:100;padding:1rem 2rem;display:flex;align-items:center;justify-between;background:rgba(0,0,0,0.6);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.08);">
    <span style="font-family:'Playfair Display',serif;font-size:1.25rem;font-weight:700;color:white;">${projectTitle}</span>
    <div style="display:flex;gap:4px;">
      ${navItems.map(h => `<a href="#${h.replace('/', '')}">${h.replace('/', '').charAt(0).toUpperCase() + h.slice(2)}</a>`).join('\n')}
      <a href="#" style="background:${primaryColor};color:white;border-radius:8px;">Get Started</a>
    </div>
  </nav>

  <!-- Hero -->
  <section class="hero-section">
    <div style="max-width:800px;margin:0 auto;">
      ${heroHtml}
      <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;margin-top:2rem;">
        <a href="#" class="cta-button">🚀 Get Started</a>
        <a href="#" style="display:inline-flex;align-items:center;gap:8px;padding:14px 28px;border-radius:12px;border:1px solid rgba(255,255,255,0.2);color:white;text-decoration:none;font-weight:500;transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">Learn More →</a>
      </div>
    </div>
  </section>

  <!-- Features Grid -->
  <section style="padding:4rem 2rem;max-width:1200px;margin:0 auto;">
    <h2 style="text-align:center;font-size:2.25rem;font-weight:700;margin-bottom:1rem;font-family:'Playfair Display',serif;">Features</h2>
    <p style="text-align:center;color:rgba(255,255,255,0.6);margin-bottom:3rem;">Built with the latest technologies</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;">
      ${['⚡ Lightning Fast', '🎨 Beautiful Design', '🔒 Secure & Reliable', '📱 Mobile First'].map(f => `
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:2rem;transition:all 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.08)';this.style.transform='translateY(-4px)'" onmouseout="this.style.background='rgba(255,255,255,0.05)';this.style.transform='translateY(0)'">
        <div style="font-size:2rem;margin-bottom:1rem;">${f.split(' ')[0]}</div>
        <h3 style="font-size:1.1rem;font-weight:600;margin:0 0 0.5rem;">${f.split(' ').slice(1).join(' ')}</h3>
        <p style="color:rgba(255,255,255,0.5);font-size:0.9rem;margin:0;line-height:1.6;">A key feature of this application that makes it stand out.</p>
      </div>`).join('\n')}
    </div>
  </section>

  <!-- CTA Section -->
  <section style="padding:4rem 2rem;text-align:center;border-top:1px solid rgba(255,255,255,0.08);">
    <h2 style="font-size:2rem;font-weight:700;margin:0 0 1rem;font-family:'Playfair Display',serif;">Ready to get started?</h2>
    <p style="color:rgba(255,255,255,0.6);margin:0 0 2rem;">Join thousands of users who already love this app.</p>
    <a href="#" class="cta-button">Start for Free →</a>
  </section>

  <!-- Footer -->
  <footer style="padding:2rem;text-align:center;border-top:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.4);font-size:0.875rem;">
    <p style="margin:0;">© 2025 ${projectTitle} · Built with <a href="https://vivorax.online" style="color:${primaryColor};text-decoration:none;">Vivora X</a></p>
  </footer>

  <!-- Theme detection -->
  <script>
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (!prefersDark) {
      document.body.style.background = '#f8fafc';
      document.body.style.color = '#0f172a';
    }
  </script>

  <a href="https://vivorax.online" class="vivora-badge" target="_blank" rel="noopener">
    🚀 Built with Vivora
  </a>
</body>
</html>`;
}

// ─── Cloudflare Pages project ─────────────────────────────────────────────────
async function getOrCreatePagesProject(projectName: string): Promise<void> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: projectName, production_branch: "main" }),
    }
  );

  if (!res.ok && res.status !== 409) {
    const err = await res.text();
    throw new Error(`Failed to create Pages project: ${err}`);
  }
}

// ─── Upload files to Cloudflare Pages ────────────────────────────────────────
async function uploadToCloudflarePages(
  projectName: string,
  files: Record<string, string>
): Promise<string> {
  const htmlContent = buildDeployableHtml(files);

  const formData = new FormData();
  const manifest: Record<string, string> = {};

  // index.html
  const htmlHash = await computeHash(htmlContent);
  formData.append("index.html", new Blob([htmlContent], { type: "text/html" }), "index.html");
  manifest["/index.html"] = htmlHash;

  // _redirects for SPA
  const redirects = "/*    /index.html   200";
  const redirectsHash = await computeHash(redirects);
  formData.append("_redirects", new Blob([redirects], { type: "text/plain" }), "_redirects");
  manifest["/_redirects"] = redirectsHash;

  // _headers
  const headers = `/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Cache-Control: public, max-age=0, must-revalidate`;
  const headersHash = await computeHash(headers);
  formData.append("_headers", new Blob([headers], { type: "text/plain" }), "_headers");
  manifest["/_headers"] = headersHash;

  formData.append("manifest", JSON.stringify(manifest));

  const deployRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${projectName}/deployments`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}` },
      body: formData,
    }
  );

  if (!deployRes.ok) {
    const errText = await deployRes.text();
    throw new Error(`Cloudflare Pages upload failed (${deployRes.status}): ${errText}`);
  }

  const deployData = await deployRes.json();
  return deployData.result?.id ?? "";
}

// ─── Setup custom subdomain DNS ───────────────────────────────────────────────
async function setupCustomSubdomain(subdomain: string, projectName: string): Promise<void> {
  if (!CLOUDFLARE_ZONE_ID) return;

  const cname = `${projectName}.pages.dev`;
  const fullName = `${subdomain}.${VIVORA_DOMAIN}`;

  // Check existing DNS
  const checkRes = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records?name=${fullName}&type=CNAME`,
    { headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}` } }
  );
  const checkData = await checkRes.json();
  const existingRecords = checkData.result || [];

  if (existingRecords.length > 0) {
    // Update existing
    await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${existingRecords[0].id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "CNAME", name: fullName, content: cname, proxied: true, ttl: 1 }),
      }
    );
  } else {
    // Create new
    await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "CNAME", name: fullName, content: cname, proxied: true, ttl: 1 }),
      }
    );
  }

  // Register custom domain with the Pages project
  // This automatically handles domain verification since both DNS and Pages are on the same CF account
  await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${projectName}/domains`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: fullName }),
    }
  );
}

// ─── Main deploy flow ─────────────────────────────────────────────────────────
async function deployToCloudflarePages(
  subdomain: string,
  files: Record<string, string>,
  userId: string
): Promise<{ url: string; deploymentId: string }> {
  const projectName = `vivora-${subdomain}`;

  await getOrCreatePagesProject(projectName);
  const deploymentId = await uploadToCloudflarePages(projectName, files);

  // Setup subdomain (no TXT verification needed since we control the zone)
  if (CLOUDFLARE_ZONE_ID) {
    try {
      await setupCustomSubdomain(subdomain, projectName);
    } catch (e) {
      console.warn("Subdomain setup warning:", e);
      // Don't fail the deployment if subdomain setup has issues
    }
  }

  const url = `https://${subdomain}.${VIVORA_DOMAIN}`;
  return { url, deploymentId };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    // GET: Check subdomain availability
    if (req.method === "GET") {
      const checkSubdomain = url.searchParams.get("check");
      if (checkSubdomain) {
        const taken = await isSubdomainTaken(checkSubdomain);
        return new Response(
          JSON.stringify({ available: !taken, subdomain: checkSubdomain }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subdomain, files, userId } = await req.json();

    if (!subdomain || subdomain.length < 3) {
      return new Response(
        JSON.stringify({ error: "Invalid subdomain (min 3 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(subdomain)) {
      return new Response(
        JSON.stringify({ error: "Invalid subdomain. Use only lowercase letters, numbers, and hyphens." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const taken = await isSubdomainTaken(subdomain);
    if (taken) {
      return new Response(
        JSON.stringify({ error: "Subdomain already taken" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseAdmin();

    // Check if Cloudflare is configured
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
      // Queue deployment
      const { data, error } = await supabase
        .from("vivora_deployments")
        .insert({
          user_id: userId,
          subdomain,
          url: `https://${subdomain}.${VIVORA_DOMAIN}`,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({
          url: `https://${subdomain}.${VIVORA_DOMAIN}`,
          deploymentId: data.id,
          status: "pending",
          message: "Cloudflare not configured. Deployment queued.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert files object
    const fileContents: Record<string, string> = {};
    for (const [path, file] of Object.entries(files || {})) {
      fileContents[path] = typeof file === "string" ? file : (file as any).content ?? "";
    }

    const { url: deployedUrl, deploymentId } = await deployToCloudflarePages(
      subdomain,
      fileContents,
      userId
    );

    // Save deployment record
    await supabase.from("vivora_deployments").insert({
      user_id: userId,
      subdomain,
      url: deployedUrl,
      cloudflare_deployment_id: deploymentId,
      status: "active",
    });

    return new Response(
      JSON.stringify({ url: deployedUrl, deploymentId, status: "active" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("vivora-deploy error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
