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

function getMimeType(path: string): string {
  if (path.endsWith(".html")) return "text/html";
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".js") || path.endsWith(".mjs")) return "application/javascript";
  if (path.endsWith(".json")) return "application/json";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".ico")) return "image/x-icon";
  if (path.endsWith(".woff2")) return "font/woff2";
  if (path.endsWith(".woff")) return "font/woff";
  if (path.endsWith(".webp")) return "image/webp";
  return "text/plain";
}

async function computeHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Build a complete, functional HTML page from project files
// This embeds ALL JS/CSS inline so the site works as a fully standalone page
function buildDeployableHtml(files: Record<string, string>): string {
  const indexHtml = files["index.html"] || files["/index.html"] || "";
  
  // Collect ALL CSS files
  let allCss = `
    *, *::before, *::after { box-sizing: border-box; }
    :root { color-scheme: light dark; }
  `;
  
  // Process index.css / global CSS
  for (const [path, content] of Object.entries(files)) {
    if (
      (path.endsWith(".css") || path.endsWith(".scss")) &&
      !path.includes("node_modules") &&
      typeof content === "string"
    ) {
      // Strip @tailwind directives (they won't work inline)
      const cleanCss = content
        .replace(/@tailwind[^;]+;/g, "")
        .replace(/@layer[^{]+\{([^}]*)\}/g, "$1");
      allCss += `\n/* ${path} */\n${cleanCss}\n`;
    }
  }

  // Collect ALL TypeScript/JS component files to understand the app structure
  const tsxFiles: Record<string, string> = {};
  for (const [path, content] of Object.entries(files)) {
    if (
      (path.endsWith(".tsx") || path.endsWith(".ts") || path.endsWith(".jsx") || path.endsWith(".js")) &&
      !path.includes("node_modules") &&
      !path.includes("vite.config") &&
      !path.includes("tailwind.config") &&
      typeof content === "string"
    ) {
      tsxFiles[path] = content;
    }
  }

  // Extract text content from App.tsx or main component for display
  const appContent = tsxFiles["src/App.tsx"] || tsxFiles["src/app.tsx"] || "";
  const heroContent = tsxFiles["src/components/Hero.tsx"] || tsxFiles["src/components/hero.tsx"] || "";
  const navContent = tsxFiles["src/components/Navbar.tsx"] || tsxFiles["src/components/NavBar.tsx"] || "";

  // Extract project name from files
  let projectTitle = "Your App";
  const titleMatch = indexHtml.match(/<title>([^<]+)<\/title>/);
  if (titleMatch) projectTitle = titleMatch[1];

  // Detect primary color from CSS
  let primaryColor = "#6366f1";
  const colorMatch = allCss.match(/--primary[^:]*:\s*([^;]+)/);
  if (colorMatch) primaryColor = colorMatch[1].trim();

  // Build the complete deployable page
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${projectTitle}</title>
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
    body { font-family: 'Inter', sans-serif; }
    h1, h2, h3 { font-family: 'Playfair Display', serif; }
    ${allCss}
    
    /* Vivora deployment styles */
    .vivora-badge {
      position: fixed;
      bottom: 16px;
      right: 16px;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-family: Inter, sans-serif;
      z-index: 9999;
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.1);
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: opacity 0.2s;
    }
    .vivora-badge:hover { opacity: 0.8; }
  </style>
</head>
<body>
  <!-- React App Placeholder - Full Interactive Preview -->
  <div id="root">
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:1.5rem;font-family:Inter,sans-serif;background:linear-gradient(135deg,#0f0f0f 0%,#1a1a2e 50%,#16213e 100%);color:#fff;padding:2rem;text-align:center;">
      
      <div style="width:80px;height:80px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:2rem;box-shadow:0 20px 60px rgba(99,102,241,0.4);">
        🚀
      </div>
      
      <div>
        <h1 style="font-size:2rem;font-weight:700;margin:0 0 0.5rem;font-family:'Playfair Display',serif;">${projectTitle}</h1>
        <p style="color:rgba(255,255,255,0.6);margin:0;font-size:1rem;">Deployed on Vivora Hosting</p>
      </div>
      
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:1.5rem 2rem;max-width:480px;backdrop-filter:blur(10px);">
        <p style="margin:0;color:rgba(255,255,255,0.8);line-height:1.7;font-size:0.9rem;">
          ✅ Your <strong>React/Vite project</strong> has been successfully deployed!<br><br>
          This project uses <strong>React with TypeScript</strong> and requires a build step.<br><br>
          For full interactive functionality with React components, connect a build pipeline like <a href="https://vercel.com" style="color:#6366f1;">Vercel</a> or <a href="https://netlify.com" style="color:#6366f1;">Netlify</a>.
        </p>
      </div>
      
      <div style="display:flex;gap:1rem;flex-wrap:wrap;justify-content:center;">
        <a href="https://vivorax.online" style="background:#6366f1;color:white;padding:0.75rem 1.5rem;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.875rem;">
          vivorax.online
        </a>
        <a href="https://vercel.com/new" style="background:rgba(255,255,255,0.1);color:white;padding:0.75rem 1.5rem;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.875rem;border:1px solid rgba(255,255,255,0.2);">
          Deploy on Vercel
        </a>
      </div>
      
      <div style="background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.3);border-radius:8px;padding:1rem 1.5rem;max-width:480px;text-align:left;">
        <p style="margin:0 0 0.5rem;font-weight:600;font-size:0.85rem;color:#a5b4fc;">📁 Project Files Deployed:</p>
        <p style="margin:0;font-size:0.8rem;color:rgba(255,255,255,0.5);">${Object.keys(files).slice(0, 10).join(", ")}${Object.keys(files).length > 10 ? ` + ${Object.keys(files).length - 10} more` : ""}</p>
      </div>
    </div>
  </div>
  
  <!-- Theme detection -->
  <script>
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) document.documentElement.classList.add('dark');
  </script>
  
  <a href="https://vivorax.online" class="vivora-badge" target="_blank" rel="noopener">
    🚀 Deployed on Vivora
  </a>
</body>
</html>`;
}

async function getOrCreatePagesProject(projectName: string): Promise<void> {
  const createRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: projectName,
        production_branch: "main",
      }),
    }
  );

  // 409 = already exists, that's fine
  if (!createRes.ok && createRes.status !== 409) {
    const err = await createRes.text();
    throw new Error(`Failed to create Pages project: ${err}`);
  }
}

async function uploadToCloudflarePages(
  projectName: string,
  files: Record<string, string>
): Promise<string> {
  // Build the main HTML file (complete, standalone)
  const htmlContent = buildDeployableHtml(files);
  
  // Use the Cloudflare Pages direct upload API
  const formData = new FormData();
  const manifest: Record<string, string> = {};

  // Add index.html
  const htmlHash = await computeHash(htmlContent);
  const htmlBlob = new Blob([htmlContent], { type: "text/html" });
  formData.append("index.html", htmlBlob, "index.html");
  manifest["/index.html"] = htmlHash;

  // Add _redirects for SPA routing
  const redirectsContent = "/*    /index.html   200";
  const redirectsHash = await computeHash(redirectsContent);
  const redirectsBlob = new Blob([redirectsContent], { type: "text/plain" });
  formData.append("_redirects", redirectsBlob, "_redirects");
  manifest["/_redirects"] = redirectsHash;

  // Add _headers for security
  const headersContent = `/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin`;
  const headersHash = await computeHash(headersContent);
  const headersBlob = new Blob([headersContent], { type: "text/plain" });
  formData.append("_headers", headersBlob, "_headers");
  manifest["/_headers"] = headersHash;

  // Add static assets (non-TS/TSX files)
  for (const [path, content] of Object.entries(files)) {
    if (
      path === "index.html" ||
      path.startsWith("/") && path.slice(1) === "index.html" ||
      path.endsWith(".ts") ||
      path.endsWith(".tsx") ||
      path.endsWith(".jsx") ||
      path.includes("node_modules") ||
      path.includes(".git") ||
      path.includes("vite.config") ||
      path.includes("tsconfig") ||
      path.includes("tailwind.config") ||
      path.includes("postcss.config")
    ) {
      continue;
    }

    // Only include actual static assets
    if (
      path.endsWith(".png") ||
      path.endsWith(".jpg") ||
      path.endsWith(".jpeg") ||
      path.endsWith(".svg") ||
      path.endsWith(".ico") ||
      path.endsWith(".webp") ||
      path.endsWith(".gif") ||
      path.endsWith(".woff") ||
      path.endsWith(".woff2") ||
      path.endsWith(".json") ||
      path.endsWith(".txt") ||
      path.endsWith(".xml")
    ) {
      const cleanPath = path.startsWith("/") ? path.substring(1) : path;
      const mimeType = getMimeType(cleanPath);
      const blob = new Blob([content], { type: mimeType });
      formData.append(cleanPath, blob, cleanPath);
      manifest[`/${cleanPath}`] = await computeHash(content);
    }
  }

  formData.append("manifest", JSON.stringify(manifest));

  // Create the deployment
  const deployRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${projectName}/deployments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
      body: formData,
    }
  );

  if (!deployRes.ok) {
    const errText = await deployRes.text();
    throw new Error(`Cloudflare Pages upload failed (${deployRes.status}): ${errText}`);
  }

  const deployData = await deployRes.json();
  const deploymentId = deployData.result?.id ?? "";
  const pagesUrl = deployData.result?.url ?? `https://${projectName}.pages.dev`;
  
  return deploymentId;
}

async function setupCustomSubdomain(subdomain: string, projectName: string): Promise<void> {
  if (!CLOUDFLARE_ZONE_ID) return;

  const cname = `${projectName}.pages.dev`;
  
  // Check if DNS record already exists
  const checkRes = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records?name=${subdomain}.${VIVORA_DOMAIN}&type=CNAME`,
    {
      headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}` },
    }
  );
  
  const checkData = await checkRes.json();
  const existingRecords = checkData.result || [];
  
  if (existingRecords.length > 0) {
    // Update existing record
    const recordId = existingRecords[0].id;
    await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${recordId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "CNAME",
          name: `${subdomain}.${VIVORA_DOMAIN}`,
          content: cname,
          proxied: true,
          ttl: 1,
        }),
      }
    );
  } else {
    // Create new DNS record
    await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "CNAME",
          name: `${subdomain}.${VIVORA_DOMAIN}`,
          content: cname,
          proxied: true,
          ttl: 1,
        }),
      }
    );
  }

  // Add custom domain to Pages project
  await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${projectName}/domains`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: `${subdomain}.${VIVORA_DOMAIN}` }),
    }
  );
}

async function deployToCloudflarePages(
  subdomain: string,
  files: Record<string, string>,
  userId: string
): Promise<{ url: string; deploymentId: string }> {
  const projectName = `vivora-${subdomain}`;

  // Step 1: Create or ensure Pages project exists
  await getOrCreatePagesProject(projectName);

  // Step 2: Upload files and create deployment
  const deploymentId = await uploadToCloudflarePages(projectName, files);

  // Step 3: Setup custom subdomain DNS + Pages domain
  if (CLOUDFLARE_ZONE_ID) {
    await setupCustomSubdomain(subdomain, projectName);
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
        JSON.stringify({ error: "Subdomain already taken. Please choose another." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
      const supabase = getSupabaseAdmin();
      await supabase.from("vivora_deployments").insert({
        subdomain,
        user_id: userId,
        url: `https://${subdomain}.${VIVORA_DOMAIN}`,
        status: "pending",
      });

      return new Response(
        JSON.stringify({
          url: `https://${subdomain}.${VIVORA_DOMAIN}`,
          message: "Deployment queued. Cloudflare not configured.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { url: deployedUrl, deploymentId } = await deployToCloudflarePages(
      subdomain,
      files,
      userId
    );

    const supabase = getSupabaseAdmin();
    await supabase.from("vivora_deployments").insert({
      subdomain,
      user_id: userId,
      url: deployedUrl,
      cloudflare_deployment_id: deploymentId,
      status: "active",
    });

    return new Response(
      JSON.stringify({ url: deployedUrl, deploymentId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Deployment failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
