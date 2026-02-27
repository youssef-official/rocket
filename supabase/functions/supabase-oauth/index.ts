import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SB_CLIENT_ID = 'bb4087af-31a0-4921-8418-d1eb743291d9';
const SB_CLIENT_SECRET = Deno.env.get('SB_OAUTH_CLIENT_SECRET')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = authData.user.id;

    // ═══════════════════════════════════════
    // ACTION: exchange - Exchange OAuth code for tokens
    // ═══════════════════════════════════════
    if (action === 'exchange') {
      const { code, redirect_uri } = params;
      if (!code || !redirect_uri) {
        return new Response(JSON.stringify({ error: 'code and redirect_uri required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const tokenRes = await fetch('https://api.supabase.com/v1/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri,
          client_id: SB_CLIENT_ID,
          client_secret: SB_CLIENT_SECRET,
        }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error('Token exchange failed:', tokenRes.status, errText);
        return new Response(JSON.stringify({ error: 'Token exchange failed', details: errText }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const tokenData = await tokenRes.json();

      // Save tokens to supabase_connections (upsert)
      const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null;

      const { error: upsertErr } = await supabase
        .from('supabase_connections')
        .upsert({
          user_id: userId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          token_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (upsertErr) {
        console.error('Save token error:', upsertErr);
        return new Response(JSON.stringify({ error: 'Failed to save token' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ═══════════════════════════════════════
    // ACTION: status - Check connection status
    // ═══════════════════════════════════════
    if (action === 'status') {
      const { data: conn } = await supabase
        .from('supabase_connections')
        .select('id, token_expires_at, updated_at')
        .eq('user_id', userId)
        .single();

      return new Response(JSON.stringify({
        connected: !!conn,
        expires_at: conn?.token_expires_at,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ═══════════════════════════════════════
    // ACTION: list-projects - List user's Supabase projects
    // ═══════════════════════════════════════
    if (action === 'list-projects') {
      const { data: conn } = await supabase
        .from('supabase_connections')
        .select('access_token')
        .eq('user_id', userId)
        .single();

      if (!conn) {
        return new Response(JSON.stringify({ error: 'Not connected to Supabase' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const projectsRes = await fetch('https://api.supabase.com/v1/projects', {
        headers: { 'Authorization': `Bearer ${conn.access_token}` },
      });

      if (!projectsRes.ok) {
        const errText = await projectsRes.text();
        return new Response(JSON.stringify({ error: 'Failed to list projects', details: errText }), {
          status: projectsRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const projects = await projectsRes.json();
      // Return simplified project list
      const simplified = projects.map((p: any) => ({
        id: p.id,
        name: p.name,
        region: p.region,
        organization_id: p.organization_id,
      }));

      return new Response(JSON.stringify({ projects: simplified }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ═══════════════════════════════════════
    // ACTION: get-keys - Get project API keys
    // ═══════════════════════════════════════
    if (action === 'get-keys') {
      const { project_ref } = params;
      if (!project_ref) {
        return new Response(JSON.stringify({ error: 'project_ref required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: conn } = await supabase
        .from('supabase_connections')
        .select('access_token')
        .eq('user_id', userId)
        .single();

      if (!conn) {
        return new Response(JSON.stringify({ error: 'Not connected' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const keysRes = await fetch(`https://api.supabase.com/v1/projects/${project_ref}/api-keys`, {
        headers: { 'Authorization': `Bearer ${conn.access_token}` },
      });

      if (!keysRes.ok) {
        return new Response(JSON.stringify({ error: 'Failed to get keys' }), {
          status: keysRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const keys = await keysRes.json();
      const anonKey = keys.find((k: any) => k.name === 'anon')?.api_key || '';
      const serviceKey = keys.find((k: any) => k.name === 'service_role')?.api_key || '';

      return new Response(JSON.stringify({
        url: `https://${project_ref}.supabase.co`,
        anon_key: anonKey,
        service_role_key: serviceKey,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ═══════════════════════════════════════
    // ACTION: run-sql - Execute SQL on user's Supabase project
    // ═══════════════════════════════════════
    if (action === 'run-sql') {
      const { project_ref, query } = params;
      if (!project_ref || !query) {
        return new Response(JSON.stringify({ error: 'project_ref and query required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: conn } = await supabase
        .from('supabase_connections')
        .select('access_token')
        .eq('user_id', userId)
        .single();

      if (!conn) {
        return new Response(JSON.stringify({ error: 'Not connected' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const sqlRes = await fetch(`https://api.supabase.com/v1/projects/${project_ref}/database/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${conn.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const sqlData = await sqlRes.json();
      
      if (!sqlRes.ok) {
        return new Response(JSON.stringify({ error: 'SQL execution failed', details: sqlData }), {
          status: sqlRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, result: sqlData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ═══════════════════════════════════════
    // ACTION: disconnect - Remove connection
    // ═══════════════════════════════════════
    if (action === 'disconnect') {
      await supabase
        .from('supabase_connections')
        .delete()
        .eq('user_id', userId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('supabase-oauth error:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
