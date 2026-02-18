import { Inngest } from "inngest";
import { serve } from "inngest/vercel";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase config
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function createSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

// Helper functions for redeployment
async function redeployToVivora(subdomain, files, userId) {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return { ok: false, error: 'Missing Supabase config for vivora deploy' };
    }

    const resp = await fetch(`${SUPABASE_URL}/functions/v1/vivora-deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ subdomain, files, userId }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: 'Deploy failed' }));
      return { ok: false, error: err.error ?? 'Deploy failed' };
    }

    const data = await resp.json();
    return { ok: true, url: data.url };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function redeployToVercel(token, projectName, files) {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return { ok: false, error: 'Missing Supabase config for Vercel deploy' };
    }

    const resp = await fetch(`${SUPABASE_URL}/functions/v1/vercel-deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ action: 'deploy', token, projectName, files }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: 'Deploy failed' }));
      return { ok: false, error: err.error ?? 'Deploy failed' };
    }

    const data = await resp.json();
    return { ok: true, deploymentId: data.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Initialize Inngest
// Using the provided Railway URL
export const inngest = new Inngest({ 
  id: "vivora-api",
  baseUrl: process.env.INNGEST_URL || "https://inngestapp-production-2935.up.railway.app",
  eventKey: process.env.INNGEST_EVENT_KEY || "dev",
  signingKey: process.env.INNGEST_SIGNING_KEY || "dev"
});

// Define Inngest functions
const autoRedeployVivora = inngest.createFunction(
  { id: "vivora-auto-redeploy", name: "Vivora Auto Redeploy" },
  { event: "vivora/project.updated" },
  async ({ event, step }) => {
    const { subdomain, files, userId } = event.data;
    
    const result = await step.run("redeploy-to-vivora", async () => {
      return await redeployToVivora(subdomain, files, userId);
    });

    if (result.ok) {
      await step.run("update-deployment-status", async () => {
        const supabase = createSupabaseAdmin();
        if (supabase) {
          await supabase
            .from('vivora_deployments')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('subdomain', subdomain);
        }
      });
    }
    
    return result;
  }
);

const autoRedeployVercel = inngest.createFunction(
  { id: "vercel-auto-redeploy", name: "Vercel Auto Redeploy" },
  { event: "vercel/project.updated" },
  async ({ event, step }) => {
    const { token, projectName, files } = event.data;
    return await step.run("redeploy-to-vercel", async () => {
      return await redeployToVercel(token, projectName, files);
    });
  }
);

const backgroundGeneration = inngest.createFunction(
  { id: "vivora-background-generation", name: "Background Code Generation" },
  { event: "vivora/generation.requested" },
  async ({ event, step }) => {
    const { projectId, userId } = event.data;
    
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

// Create the serve handler
const inngestHandler = serve({
  client: inngest,
  functions: [
    autoRedeployVivora,
    autoRedeployVercel,
    backgroundGeneration,
  ],
});

// Export a custom handler to support the frontend's custom 'send-event' action
export default async function handler(req, res) {
  // Check for custom send-event action from frontend
  if (req.method === 'POST') {
    let body = {};
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    } catch (e) {
      // Fallback if parsing fails
    }

    if (body.action === 'send-event') {
      try {
        await inngest.send({
          name: body.eventName,
          data: body.eventData || {},
        });
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({ ok: true });
        return;
      } catch (error) {
        console.error("Error sending Inngest event:", error);
        res.status(500).json({ ok: false, error: error.message });
        return;
      }
    }
  }

  // Otherwise, let the official Inngest handler take over
  return await inngestHandler(req, res);
}
