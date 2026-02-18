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

// ─── Create or get Vercel project ────────────────────────────────────────────
async function getOrCreateVercelProject(
  token: string,
  safeName: string
): Promise<{ id: string; name: string } | null> {
  // Try to create
  const createRes = await fetch("https://api.vercel.com/v9/projects", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: safeName, framework: "vite" }),
  });

  if (createRes.ok) return await createRes.json();

  const err = await createRes.json().catch(() => ({}));
  if (err?.error?.code === "project_already_exists") {
    // Get existing
    const getRes = await fetch(
      `https://api.vercel.com/v9/projects/${safeName}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (getRes.ok) return await getRes.json();
  }

  return null;
}

// ─── Create deployment ────────────────────────────────────────────────────────
async function createVercelDeployment(
  token: string,
  safeName: string,
  files: Record<string, ProjectFile>
) {
  const vercelFiles = Object.entries(files).map(([path, file]) => ({
    file: path.startsWith("/") ? path.substring(1) : path,
    data: file.content ?? "",
  }));

  // Ensure package.json has required deps
  const basePkg = {
    name: safeName,
    private: true,
    version: "0.0.0",
    type: "module",
    scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
    dependencies: {
      react: "^18.2.0",
      "react-dom": "^18.2.0",
      "framer-motion": "^11.0.0",
      "lucide-react": "^0.400.0",
      clsx: "^2.1.0",
      "tailwind-merge": "^2.2.0",
    },
    devDependencies: {
      "@types/react": "^18.2.0",
      "@types/react-dom": "^18.2.0",
      "@vitejs/plugin-react": "^4.0.0",
      typescript: "^5.0.0",
      vite: "^5.0.0",
      tailwindcss: "^3.4.0",
      postcss: "^8.4.0",
      autoprefixer: "^10.4.0",
    },
  };

  const pkgIdx = vercelFiles.findIndex((f) => f.file === "package.json");
  if (pkgIdx === -1) {
    vercelFiles.push({
      file: "package.json",
      data: JSON.stringify(basePkg, null, 2),
    });
  } else {
    try {
      const existing = JSON.parse(vercelFiles[pkgIdx].data);
      existing.dependencies = {
        ...basePkg.dependencies,
        ...(existing.dependencies || {}),
      };
      existing.devDependencies = {
        ...basePkg.devDependencies,
        ...(existing.devDependencies || {}),
      };
      vercelFiles[pkgIdx].data = JSON.stringify(existing, null, 2);
    } catch {
      vercelFiles[pkgIdx].data = JSON.stringify(basePkg, null, 2);
    }
  }

  if (
    !vercelFiles.some(
      (f) => f.file === "vite.config.ts" || f.file === "vite.config.js"
    )
  ) {
    vercelFiles.push({
      file: "vite.config.ts",
      data: `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nexport default defineConfig({ plugins: [react()] })\n`,
    });
  }

  const deployRes = await fetch("https://api.vercel.com/v13/deployments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: safeName,
      files: vercelFiles,
      projectSettings: {
        framework: "vite",
        buildCommand: "npm run build",
        outputDirectory: "dist",
      },
    }),
  });

  if (!deployRes.ok) {
    const error = await deployRes.json().catch(() => ({}));
    throw new Error(
      error?.error?.message || `Vercel deployment failed: ${deployRes.status}`
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
  const res = await fetch(
    `https://api.vercel.com/v13/deployments/${deploymentId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
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
    const { action, token, projectName, files, deploymentId } =
      await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing Vercel token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const safeName = (projectName || "vivora-project")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 100);

    if (action === "deploy") {
      const project = await getOrCreateVercelProject(token, safeName);
      if (!project) {
        return new Response(
          JSON.stringify({ error: "Failed to create Vercel project" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const deployment = await createVercelDeployment(token, safeName, files);
      return new Response(JSON.stringify(deployment), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "status") {
      const status = await getDeploymentStatus(token, deploymentId);
      return new Response(JSON.stringify(status), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
