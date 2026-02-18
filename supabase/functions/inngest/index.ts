import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Self-hosted Inngest endpoint
const INNGEST_URL = Deno.env.get("INNGEST_URL") ?? "https://inngestapp-production-2935.up.railway.app";
const INNGEST_SIGNING_KEY = Deno.env.get("INNGEST_SIGNING_KEY") ?? "";
const INNGEST_EVENT_KEY = Deno.env.get("INNGEST_EVENT_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-inngest-signature, x-inngest-env, x-supabase-client-platform, x-supabase-client-platform-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
};

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

// ── Vivora redeploy function ──────────────────────────────────────────────────
async function redeployToVivora(
  subdomain: string,
  files: Record<string, string>,
  userId: string
): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const resp = await fetch(`${supabaseUrl}/functions/v1/vivora-deploy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ subdomain, files, userId }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Deploy failed" }));
      return { ok: false, error: err.error };
    }

    const data = await resp.json();
    return { ok: true, url: data.url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// ── Vercel redeploy function ──────────────────────────────────────────────────
async function redeployToVercel(
  token: string,
  projectName: string,
  files: Record<string, { content: string }>
): Promise<{ ok: boolean; deploymentId?: string; error?: string }> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const resp = await fetch(`${supabaseUrl}/functions/v1/vercel-deploy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ action: "deploy", token, projectName, files }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Deploy failed" }));
      return { ok: false, error: err.error };
    }

    const data = await resp.json();
    return { ok: true, deploymentId: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// ── Inngest functions registry ────────────────────────────────────────────────
const inngestFunctions = [
  {
    id: "vivora/auto-redeploy",
    name: "Vivora Auto Redeploy",
    triggers: [{ event: "vivora/project.updated" }],
    steps: {
      redeploy: {
        id: "redeploy-to-vivora",
        name: "Redeploy project to Vivora",
      },
    },
  },
  {
    id: "vercel/auto-redeploy",
    name: "Vercel Auto Redeploy",
    triggers: [{ event: "vercel/project.updated" }],
    steps: {
      redeploy: {
        id: "redeploy-to-vercel",
        name: "Redeploy project to Vercel",
      },
    },
  },
  {
    id: "vivora/background-generation",
    name: "Background Code Generation",
    triggers: [{ event: "vivora/generation.requested" }],
    steps: {
      generate: {
        id: "generate-and-save",
        name: "Generate code and save to project",
      },
    },
  },
];

// ── Send event to self-hosted Inngest ─────────────────────────────────────────
export async function sendInngestEvent(
  name: string,
  data: Record<string, unknown>
): Promise<boolean> {
  if (!INNGEST_EVENT_KEY) return false;

  try {
    const resp = await fetch(`${INNGEST_URL}/e/${INNGEST_EVENT_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, data, ts: Date.now() }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ── GET /inngest — Return function list for sync ───────────────────────────
  if (req.method === "GET") {
    // Inngest SDK sync endpoint — returns function definitions
    const appId = "vivora-supabase";
    const syncPayload = {
      url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/inngest`,
      framework: "edge",
      sdk: "inngest-js:v3",
      v: "1",
      appId,
      functions: inngestFunctions,
    };

    return new Response(JSON.stringify(syncPayload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── POST — Handle Inngest invocations ────────────────────────────────────
  if (req.method === "POST") {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle send-event action from our frontend
    if (body.action === "send-event") {
      const { eventName, eventData } = body as {
        action: string;
        eventName: string;
        eventData: Record<string, unknown>;
      };

      const ok = await sendInngestEvent(eventName, eventData);

      return new Response(JSON.stringify({ ok }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle Inngest SDK invocation (when Inngest calls this function)
    const fnId = body.fn_id as string | undefined;
    const event = body.event as { name: string; data: Record<string, unknown> } | undefined;

    if (!fnId || !event) {
      return new Response(JSON.stringify({ error: "Missing fn_id or event" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── vivora/auto-redeploy ─────────────────────────────────────────────
    if (fnId === "vivora/auto-redeploy") {
      const { subdomain, files, userId } = event.data as {
        subdomain: string;
        files: Record<string, string>;
        userId: string;
      };

      const result = await redeployToVivora(subdomain, files, userId);

      // Update deployment record
      if (result.ok) {
        const supabase = getSupabaseAdmin();
        await supabase
          .from("vivora_deployments")
          .update({ status: "active", updated_at: new Date().toISOString() })
          .eq("subdomain", subdomain);
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── vercel/auto-redeploy ─────────────────────────────────────────────
    if (fnId === "vercel/auto-redeploy") {
      const { token, projectName, files } = event.data as {
        token: string;
        projectName: string;
        files: Record<string, { content: string }>;
      };

      const result = await redeployToVercel(token, projectName, files);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── vivora/background-generation ─────────────────────────────────────
    if (fnId === "vivora/background-generation") {
      const { projectId, userId } = event.data as {
        projectId: string;
        userId: string;
      };

      const supabase = getSupabaseAdmin();
      await supabase
        .from("projects")
        .update({ generation_status: "generating" })
        .eq("id", projectId)
        .eq("user_id", userId);

      return new Response(JSON.stringify({ ok: true, status: "generation queued" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown function" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── PUT — Inngest sync confirmation ──────────────────────────────────────
  if (req.method === "PUT") {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
