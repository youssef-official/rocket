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
      // Return the OAuth authorization URL
      const authUrl = `https://vercel.com/integrations/oauthv2/authorize?client_id=${VERCEL_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user`;
      return new Response(JSON.stringify({ url: authUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "exchange-code") {
      // Exchange authorization code for access token
      const tokenResponse = await fetch("https://api.vercel.com/v2/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: VERCEL_CLIENT_ID,
          client_secret: VERCEL_CLIENT_SECRET,
          code,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Vercel token exchange error:", errorText);
        return new Response(JSON.stringify({ error: "Failed to exchange code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Get user info
      const userResponse = await fetch("https://api.vercel.com/v2/user", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      let username = "";
      if (userResponse.ok) {
        const userData = await userResponse.json();
        username = userData.user?.username || userData.user?.name || "";
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
