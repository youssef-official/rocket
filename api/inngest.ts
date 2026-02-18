import { Inngest } from "inngest";
import { serve } from "inngest/vercel";
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// --- Types ---
interface RedeployPayload {
  subdomain: string;
  files: Record<string, string>;
  userId: string;
}

interface VercelRedeployPayload {
  token: string;
  projectName: string;
  files: any;
}

interface GenerationPayload {
  projectId: string;
  userId: string;
}

// --- Config ---
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ".";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ".";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ".";
const INNGEST_URL = process.env.INNGEST_URL || "https://inngestapp-production-2935.up.railway.app";

// --- Helpers ---
const createSupabaseAdmin = (): SupabaseClient | null => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
};

async function redeployToVivora(payload: RedeployPayload) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase config for vivora deploy');
  }

  const resp = await fetch(`${SUPABASE_URL}/functions/v1/vivora-deploy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Deploy failed' }));
    throw new Error(err.error ?? 'Deploy failed');
  }

  return await resp.json();
}

async function redeployToVercel(payload: VercelRedeployPayload) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase config for Vercel deploy');
  }

  const resp = await fetch(`${SUPABASE_URL}/functions/v1/vercel-deploy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ action: 'deploy', ...payload }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Deploy failed' }));
    throw new Error(err.error ?? 'Deploy failed');
  }

  return await resp.json();
}

// --- Inngest Setup ---
export const inngest = new Inngest({ 
  id: "vivora-api",
  baseUrl: INNGEST_URL
});

const autoRedeployVivora = inngest.createFunction(
  { id: "vivora-auto-redeploy", name: "Vivora Auto Redeploy" },
  { event: "vivora/project.updated" },
  async ({ event, step }) => {
    const data = event.data as RedeployPayload;
    
    const result = await step.run("redeploy-to-vivora", async () => {
      return await redeployToVivora(data);
    });

    await step.run("update-deployment-status", async () => {
      const supabase = createSupabaseAdmin();
      if (supabase) {
        await supabase
          .from('vivora_deployments')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('subdomain', data.subdomain);
      }
    });
    
    return result;
  }
);

const autoRedeployVercel = inngest.createFunction(
  { id: "vercel-auto-redeploy", name: "Vercel Auto Redeploy" },
  { event: "vercel/project.updated" },
  async ({ event, step }) => {
    const data = event.data as VercelRedeployPayload;
    return await step.run("redeploy-to-vercel", async () => {
      return await redeployToVercel(data);
    });
  }
);

const backgroundGeneration = inngest.createFunction(
  { id: "vivora-background-generation", name: "Background Code Generation" },
  { event: "vivora/generation.requested" },
  async ({ event, step }) => {
    const { projectId, userId } = event.data as GenerationPayload;
    
    await step.run("update-generation-status", async () => {
      const supabase = createSupabaseAdmin();
      if (supabase && projectId && userId) {
        await supabase
          .from('projects')
          .update({ generation_status: 'generating' })
          .eq('id', projectId)
          .eq('user_id', userId);
      }
    });

    return { ok: true, status: 'generation queued' };
  }
);

// --- Handler ---
const inngestHandler = serve({
  client: inngest,
  functions: [
    autoRedeployVivora,
    autoRedeployVercel,
    backgroundGeneration,
  ],
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle custom send-event from frontend
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    if (body?.action === 'send-event') {
      try {
        await inngest.send({
          name: body.eventName,
          data: body.eventData || {},
        });
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({ ok: true });
      } catch (error: any) {
        return res.status(500).json({ ok: false, error: error.message });
      }
    }
  }

  return await inngestHandler(req, res);
}
