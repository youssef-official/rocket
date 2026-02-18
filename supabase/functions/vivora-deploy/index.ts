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

// Check if subdomain is already used
async function isSubdomainTaken(subdomain: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("vivora_deployments")
    .select("id")
    .eq("subdomain", subdomain)
    .maybeSingle();
  return !!data;
}

// Build HTML bundle from project files (supports both HTML-only and Vite projects)
function buildHtmlBundle(files: Record<string, string>): string {
  // If there's a standalone index.html, use it as base
  const indexHtml = files["index.html"] || files["/index.html"] || "";

  // Collect all CSS
  let allCss = "";
  for (const [path, content] of Object.entries(files)) {
    if (
      (path.endsWith(".css") || path.endsWith(".scss")) &&
      !path.includes("node_modules")
    ) {
      allCss += `\n/* === ${path} === */\n${content}\n`;
    }
  }

  // For Vite/React projects, build a simple static wrapper
  if (
    !indexHtml ||
    Object.keys(files).some((p) => p.endsWith(".tsx") || p.endsWith(".jsx"))
  ) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vivora App</title>
  <link rel="icon" href="data:," />
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    ${allCss}
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body>
  <div id="root">
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:1rem;font-family:Inter,sans-serif;background:#0a0a0a;color:#fff;">
      <div style="font-size:3rem;">🚀</div>
      <h1 style="font-size:1.5rem;font-weight:700;">Your app is live on Vivora!</h1>
      <p style="color:#888;text-align:center;max-width:400px;">This React/Vite project has been deployed. For full interactive functionality, connect a build pipeline.</p>
      <a href="https://vivorax.online" style="color:#a855f7;text-decoration:underline;">vivorax.online</a>
    </div>
  </div>
  <script src="https://www.vivorax.online/branding.js" defer></script>
</body>
</html>`;
  }

  // Inject CSS into existing HTML
  let result = indexHtml;
  if (allCss) {
    result = result.replace(
      "</head>",
      `<style>${allCss}</style>\n</head>`
    );
  }
  return result;
}

// Deploy to Cloudflare Pages via direct upload API
async function deployToCloudflarePages(
  subdomain: string,
  files: Record<string, string>,
  userId: string
): Promise<{ url: string; deploymentId: string }> {
  const projectName = `vivora-${subdomain}`;

  // Step 1: Create/ensure Pages project exists
  const createProjectRes = await fetch(
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

  // 409 = project already exists, that's OK
  if (!createProjectRes.ok && createProjectRes.status !== 409) {
    const err = await createProjectRes.text();
    throw new Error(`Failed to create Pages project: ${err}`);
  }

  // Step 2: Upload files via multipart form
  const htmlContent = buildHtmlBundle(files);

  const formData = new FormData();
  const manifest: Record<string, string> = {};

  // Upload index.html
  const htmlBlob = new Blob([htmlContent], { type: "text/html" });
  formData.append("index.html", htmlBlob, "index.html");
  manifest["/index.html"] = await computeHash(htmlContent);

  // Upload other static files (CSS, images, etc.)
  for (const [path, content] of Object.entries(files)) {
    if (
      path === "index.html" ||
      path.endsWith(".tsx") ||
      path.endsWith(".ts") ||
      path.endsWith(".jsx") ||
      path.endsWith(".js") ||
      path.includes("node_modules") ||
      path.includes(".git")
    ) {
      continue;
    }
    const cleanPath = path.startsWith("/") ? path.substring(1) : path;
    const blob = new Blob([content], { type: getMimeType(cleanPath) });
    formData.append(cleanPath, blob, cleanPath);
    manifest[`/${cleanPath}`] = await computeHash(content);
  }

  formData.append("manifest", JSON.stringify(manifest));

  // Step 3: Create deployment
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
    const err = await deployRes.text();
    throw new Error(`Cloudflare Pages deployment failed: ${err}`);
  }

  const deployData = await deployRes.json();
  const deploymentId = deployData.result?.id ?? "";

  // Step 4: Setup custom subdomain via Cloudflare DNS
  if (CLOUDFLARE_ZONE_ID) {
    await setupCustomSubdomain(subdomain, projectName);
  }

  const url = `https://${subdomain}.${VIVORA_DOMAIN}`;
  return { url, deploymentId };
}

async function setupCustomSubdomain(subdomain: string, pagesProject: string) {
  // Add CNAME record for subdomain → pages project
  const cname = `${pagesProject}.pages.dev`;
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

  // Add custom domain to Pages project
  await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/vivora-${subdomain}/domains`,
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

function getMimeType(path: string): string {
  if (path.endsWith(".html")) return "text/html";
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".js")) return "application/javascript";
  if (path.endsWith(".json")) return "application/json";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".ico")) return "image/x-icon";
  return "text/plain";
}

async function computeHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    // ── GET: Check subdomain availability ────────────────────────────────────
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

    // ── POST: Deploy ─────────────────────────────────────────────────────────
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
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate subdomain format
    if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(subdomain)) {
      return new Response(
        JSON.stringify({
          error: "Invalid subdomain. Use only lowercase letters, numbers, and hyphens.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check availability again server-side
    const taken = await isSubdomainTaken(subdomain);
    if (taken) {
      return new Response(
        JSON.stringify({ error: "Subdomain already taken. Please choose another." }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if Cloudflare is configured
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
      // Fallback: simulate deployment (for testing without Cloudflare setup)
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
          message:
            "Deployment queued. Cloudflare integration pending setup.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deploy to Cloudflare Pages
    const { url: deployedUrl, deploymentId } = await deployToCloudflarePages(
      subdomain,
      files,
      userId
    );

    // Save deployment record
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
      JSON.stringify({
        error: e instanceof Error ? e.message : "Deployment failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
