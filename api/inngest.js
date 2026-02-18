import { createClient } from '@supabase/supabase-js';

const INNGEST_URL = process.env.INNGEST_URL ?? 'https://inngestapp-production-2935.up.railway.app';
const INNGEST_EVENT_KEY = process.env.INNGEST_EVENT_KEY ?? '';
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const inngestFunctions = [
  {
    id: 'vivora/auto-redeploy',
    name: 'Vivora Auto Redeploy',
    triggers: [{ event: 'vivora/project.updated' }],
    steps: {
      redeploy: {
        id: 'redeploy-to-vivora',
        name: 'Redeploy project to Vivora',
      },
    },
  },
  {
    id: 'vercel/auto-redeploy',
    name: 'Vercel Auto Redeploy',
    triggers: [{ event: 'vercel/project.updated' }],
    steps: {
      redeploy: {
        id: 'redeploy-to-vercel',
        name: 'Redeploy project to Vercel',
      },
    },
  },
  {
    id: 'vivora/background-generation',
    name: 'Background Code Generation',
    triggers: [{ event: 'vivora/generation.requested' }],
    steps: {
      generate: {
        id: 'generate-and-save',
        name: 'Generate code and save to project',
      },
    },
  },
];

function createSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

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

async function sendInngestEvent(name, data) {
  if (!INNGEST_EVENT_KEY) return false;

  try {
    const resp = await fetch(`${INNGEST_URL}/e/${INNGEST_EVENT_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, data, ts: Date.now() }),
    });

    return resp.ok;
  } catch {
    return false;
  }
}

function sendJson(res, status, payload) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'authorization, x-client-info, apikey, content-type, x-inngest-signature, x-inngest-env, x-supabase-client-platform, x-supabase-client-platform-version, server-timing',
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Expose-Headers', 'x-inngest-signature, server-timing');
  res.send(JSON.stringify(payload));
}

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const endpointUrl = `${protocol}://${host}/api/inngest`;

    return sendJson(res, 200, {
      name: 'vivora-api',
      app_id: 'vivora-api',
      url: endpointUrl,
      framework: 'api',
      sdk: 'inngest-js:v3.0.0',
      v: '1',
      authentication_succeeded: true,
      schema_version: '2024-05-24',
      function_count: inngestFunctions.length,
      has_event_key: !!INNGEST_EVENT_KEY,
      has_signing_key: true,
      mode: 'cloud',
      functions: inngestFunctions,
    });
  }

  if (req.method === 'PUT') {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch {
    return sendJson(res, 400, { error: 'Invalid JSON' });
  }

  if (body.action === 'send-event') {
    const ok = await sendInngestEvent(body.eventName, body.eventData ?? {});
    return sendJson(res, 200, { ok });
  }

  const fnId = body.fn_id;
  const event = body.event;

  if (!fnId || !event) {
    return sendJson(res, 400, { error: 'Missing fn_id or event' });
  }

  if (fnId === 'vivora/auto-redeploy') {
    const { subdomain, files, userId } = event.data || {};
    const result = await redeployToVivora(subdomain, files, userId);

    if (result.ok) {
      const supabase = createSupabaseAdmin();
      if (supabase) {
        await supabase
          .from('vivora_deployments')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('subdomain', subdomain);
      }
    }

    return sendJson(res, 200, result);
  }

  if (fnId === 'vercel/auto-redeploy') {
    const { token, projectName, files } = event.data || {};
    const result = await redeployToVercel(token, projectName, files);
    return sendJson(res, 200, result);
  }

  if (fnId === 'vivora/background-generation') {
    const { projectId, userId } = event.data || {};
    const supabase = createSupabaseAdmin();

    if (supabase && projectId && userId) {
      await supabase
        .from('projects')
        .update({ generation_status: 'generating' })
        .eq('id', projectId)
        .eq('user_id', userId);
    }

    return sendJson(res, 200, { ok: true, status: 'generation queued' });
  }

  return sendJson(res, 404, { error: 'Unknown function' });
}
