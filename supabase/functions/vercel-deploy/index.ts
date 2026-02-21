import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface ProjectFile {
  content: string;
  language?: string;
}

function safeName(projectName: string): string {
  return (projectName || "vivora-project")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 100) || "vivora-project";
}

// ─── Create or get Vercel project ────────────────────────────────────────────
async function getOrCreateVercelProject(
  token: string,
  name: string
): Promise<{ id: string; name: string }> {
  // Try to get existing project first
  const getRes = await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(name)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (getRes.ok) return await getRes.json();

  // Try create
  const createRes = await fetch("https://api.vercel.com/v9/projects", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name, framework: "vite" }),
  });

  if (createRes.ok) return await createRes.json();

  const err = await createRes.json().catch(() => ({}));
  
  // If token is invalid, give a clear message
  if (err?.error?.invalidToken || err?.error?.code === "forbidden") {
    throw new Error("Your Vercel token has expired or is invalid. Please reconnect your Vercel account in Settings.");
  }

  throw new Error(`Failed to create/get Vercel project: ${JSON.stringify(err)}`);
}

// ─── Build package.json ───────────────────────────────────────────────────────
function buildPackageJson(name: string, existing?: string): string {
  const base = {
    name,
    private: true,
    version: "0.0.0",
    type: "module",
    scripts: { dev: "vite", build: "tsc -b && vite build", preview: "vite preview" },
    dependencies: {
      react: "^18.3.1",
      "react-dom": "^18.3.1",
      "framer-motion": "^11.0.0",
      "lucide-react": "^0.462.0",
      clsx: "^2.1.1",
      "tailwind-merge": "^2.6.0",
    },
    devDependencies: {
      "@types/react": "^18.3.5",
      "@types/react-dom": "^18.3.0",
      "@vitejs/plugin-react": "^4.3.1",
      typescript: "^5.5.3",
      vite: "^5.4.2",
      tailwindcss: "^3.4.11",
      postcss: "^8.4.47",
      autoprefixer: "^10.4.20",
    },
  };

  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      parsed.scripts = { ...base.scripts, ...(parsed.scripts || {}) };
      parsed.dependencies = { ...base.dependencies, ...(parsed.dependencies || {}) };
      parsed.devDependencies = { ...base.devDependencies, ...(parsed.devDependencies || {}) };
      if (!parsed.type) parsed.type = "module";
      return JSON.stringify(parsed, null, 2);
    } catch {}
  }

  return JSON.stringify(base, null, 2);
}

// ─── Build vite config ────────────────────────────────────────────────────────
function buildViteConfig(): string {
  return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: { manualChunks: undefined }
    }
  }
})
`;
}

// ─── Build tsconfig ───────────────────────────────────────────────────────────
function buildTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: "ES2020",
      useDefineForClassFields: true,
      lib: ["ES2020", "DOM", "DOM.Iterable"],
      module: "ESNext",
      skipLibCheck: true,
      moduleResolution: "bundler",
      allowImportingTsExtensions: true,
      isolatedModules: true,
      moduleDetection: "force",
      noEmit: true,
      jsx: "react-jsx",
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true
    },
    include: ["src"],
    references: [{ path: "./tsconfig.node.json" }]
  }, null, 2);
}

function buildTsNodeConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: "ES2022",
      lib: ["ES2023"],
      module: "ESNext",
      moduleResolution: "bundler",
      allowSyntheticDefaultImports: true,
      strict: true,
      noEmit: true
    },
    include: ["vite.config.ts"]
  }, null, 2);
}

// ─── Create Vercel deployment ─────────────────────────────────────────────────
async function createVercelDeployment(
  token: string,
  name: string,
  files: Record<string, ProjectFile>
) {
  const vercelFiles: { file: string; data: string }[] = [];

  // Normalize all project files
  for (const [path, file] of Object.entries(files)) {
    const cleanPath = path.startsWith("/") ? path.substring(1) : path;
    vercelFiles.push({ file: cleanPath, data: file.content ?? "" });
  }

  // Ensure package.json
  const pkgIdx = vercelFiles.findIndex(f => f.file === "package.json");
  if (pkgIdx === -1) {
    vercelFiles.push({ file: "package.json", data: buildPackageJson(name) });
  } else {
    vercelFiles[pkgIdx].data = buildPackageJson(name, vercelFiles[pkgIdx].data);
  }

  // Ensure vite.config.ts
  if (!vercelFiles.some(f => f.file === "vite.config.ts" || f.file === "vite.config.js")) {
    vercelFiles.push({ file: "vite.config.ts", data: buildViteConfig() });
  }

  // Ensure tsconfig.app.json
  if (!vercelFiles.some(f => f.file === "tsconfig.app.json")) {
    vercelFiles.push({ file: "tsconfig.app.json", data: buildTsConfig() });
  }
  // Ensure tsconfig.json
  if (!vercelFiles.some(f => f.file === "tsconfig.json")) {
    vercelFiles.push({
      file: "tsconfig.json",
      data: JSON.stringify({
        files: [],
        references: [{ path: "./tsconfig.app.json" }, { path: "./tsconfig.node.json" }]
      }, null, 2)
    });
  }
  // Ensure tsconfig.node.json
  if (!vercelFiles.some(f => f.file === "tsconfig.node.json")) {
    vercelFiles.push({ file: "tsconfig.node.json", data: buildTsNodeConfig() });
  }

  // Ensure postcss.config.js
  if (!vercelFiles.some(f => f.file === "postcss.config.js" || f.file === "postcss.config.cjs")) {
    vercelFiles.push({
      file: "postcss.config.js",
      data: `export default { plugins: { tailwindcss: {}, autoprefixer: {} } }\n`,
    });
  }

  // Ensure tailwind.config.js/ts
  if (!vercelFiles.some(f => f.file.startsWith("tailwind.config"))) {
    vercelFiles.push({
      file: "tailwind.config.js",
      data: `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: { extend: {} },
  plugins: [],
}
`,
    });
  }

  // Ensure index.html
  if (!vercelFiles.some(f => f.file === "index.html")) {
    vercelFiles.push({
      file: "index.html",
      data: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="data:," />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vivora App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
    });
  }

  // Ensure vercel.json for SPA routing
  if (!vercelFiles.some(f => f.file === "vercel.json")) {
    vercelFiles.push({
      file: "vercel.json",
      data: JSON.stringify({ rewrites: [{ source: "/(.*)", destination: "/index.html" }] }, null, 2),
    });
  }

  const deployRes = await fetch("https://api.vercel.com/v13/deployments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      files: vercelFiles,
      projectSettings: {
        framework: "vite",
        buildCommand: "npm run build",
        outputDirectory: "dist",
        installCommand: "npm install",
      },
      target: "production",
    }),
  });

  if (!deployRes.ok) {
    const error = await deployRes.json().catch(() => ({}));
    throw new Error(
      `Vercel deployment failed (${deployRes.status}): ${error?.error?.message || JSON.stringify(error)}`
    );
  }

  const data = await deployRes.json();
  return {
    id: data.id,
    url: `https://${data.url}`,
    readyState: data.readyState,
    alias: data.alias,
  };
}

// ─── Get deployment status ────────────────────────────────────────────────────
async function getDeploymentStatus(token: string, deploymentId: string) {
  const res = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    id: data.id,
    url: `https://${data.url}`,
    readyState: data.readyState,
    alias: data.alias,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, token, projectName, files, deploymentId } = body;

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing Vercel token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const name = safeName(projectName);

    if (action === "deploy") {
      const project = await getOrCreateVercelProject(token, name);
      const deployment = await createVercelDeployment(token, project.name || name, files || {});
      return new Response(JSON.stringify(deployment), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "status") {
      const status = await getDeploymentStatus(token, deploymentId);
      return new Response(JSON.stringify(status || { error: "Deployment not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action. Use 'deploy' or 'status'" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("vercel-deploy error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
