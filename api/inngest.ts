import { Inngest } from "inngest";
import { serve } from "inngest/vercel";
import { createClient } from '@supabase/supabase-js';

// --- Config ---
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const INNGEST_URL = process.env.INNGEST_URL || "https://inngestapp-production-2935.up.railway.app";

// --- Inngest Client ---
export const inngest = new Inngest({ 
  id: "vivora-api",
  baseUrl: INNGEST_URL
});

// --- Functions ---
const autoRedeployVivora = inngest.createFunction(
  { id: "vivora-auto-redeploy", name: "Vivora Auto Redeploy" },
  { event: "vivora/project.updated" },
  async ({ event, step }) => {
    const { subdomain, files, userId } = event.data;
    
    const result = await step.run("redeploy-to-vivora", async () => {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/vivora-deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ subdomain, files, userId }),
      });
      if (!resp.ok) throw new Error('Deploy failed');
      return await resp.json();
    });

    await step.run("update-status", async () => {
      if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabase
        .from('vivora_deployments')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('subdomain', subdomain);
    });
    
    return result;
  }
);

const autoRedeployVercel = inngest.createFunction(
  { id: "vercel-auto-redeploy", name: "Vercel Auto Redeploy" },
  { event: "vercel/project.updated" },
  async ({ event, step }) => {
    const { token, projectName, files } = event.data;
    return await step.run("redeploy", async () => {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/vercel-deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: 'deploy', token, projectName, files }),
      });
      if (!resp.ok) throw new Error('Vercel deploy failed');
      return await resp.json();
    });
  }
);

const backgroundGeneration = inngest.createFunction(
  { id: "vivora-background-generation", name: "Background Code Generation" },
  { event: "vivora/generation.requested" },
  async ({ event, step }) => {
    const { projectId, userId } = event.data;
    await step.run("update-gen-status", async () => {
      if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabase
        .from('projects')
        .update({ generation_status: 'generating' })
        .eq('id', projectId)
        .eq('user_id', userId);
    });
    return { ok: true };
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

export default async function handler(req: any, res: any) {
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
        console.error("Inngest send error:", error);
        return res.status(500).json({ ok: false, error: error.message });
      }
    }
  }

  return await inngestHandler(req, res);
}
