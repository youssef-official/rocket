import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, code, redirectUri } = await req.json();
    const VERCEL_CLIENT_ID = Deno.env.get("VERCEL_CLIENT_ID");
    const VERCEL_CLIENT_SECRET = Deno.env.get("VERCEL_CLIENT_SECRET");

    if (!VERCEL_CLIENT_ID || !VERCEL_CLIENT_SECRET) {
      return new Response(JSON.stringify({ error: "Vercel OAuth not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get-auth-url") {
      // Return the OAuth authorization URL (per Vercel docs: https://vercel.com/oauth/authorize)
      const queryParams = new URLSearchParams({
        client_id: VERCEL_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile offline_access",
      });
      const authUrl = `https://vercel.com/oauth/authorize?${queryParams.toString()}`;
      return new Response(JSON.stringify({ url: authUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "exchange-code") {
      // Exchange authorization code for access token (per Vercel docs: /login/oauth/token)
      const tokenResponse = await fetch("https://api.vercel.com/login/oauth/token", {
        method: "POST",
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: VERCEL_CLIENT_ID,
          client_secret: VERCEL_CLIENT_SECRET,
          code,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Vercel token exchange error:", errorText);
        return new Response(JSON.stringify({ error: "Failed to exchange code", details: errorText }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Get user info using the userinfo endpoint
      const userResponse = await fetch("https://api.vercel.com/login/oauth/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      let username = "";
      if (userResponse.ok) {
        const userData = await userResponse.json();
        username = userData.preferred_username || userData.name || userData.email || "";
      }

      return new Response(JSON.stringify({ 
        access_token: accessToken, 
        username 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("vercel-oauth error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
