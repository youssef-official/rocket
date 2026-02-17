import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Generate a cryptographically secure random string
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomBytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(randomBytes, (byte) => charset[byte % charset.length]).join('');
}

// Generate SHA-256 code challenge from code verifier
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  // Base64url encode
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// In-memory store for code verifiers (keyed by state)
const codeVerifiers = new Map<string, { verifier: string; timestamp: number }>();

// Clean up old entries (older than 10 minutes)
function cleanupOldEntries() {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  for (const [key, value] of codeVerifiers.entries()) {
    if (value.timestamp < tenMinutesAgo) {
      codeVerifiers.delete(key);
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, code, redirectUri, state } = await req.json();
    const VERCEL_CLIENT_ID = Deno.env.get("VERCEL_CLIENT_ID");
    const VERCEL_CLIENT_SECRET = Deno.env.get("VERCEL_CLIENT_SECRET");

    if (!VERCEL_CLIENT_ID || !VERCEL_CLIENT_SECRET) {
      return new Response(JSON.stringify({ error: "Vercel OAuth not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get-auth-url") {
      cleanupOldEntries();

      // Generate PKCE parameters
      const codeVerifier = generateRandomString(64);
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const oauthState = generateRandomString(43);

      // Store code verifier keyed by state
      codeVerifiers.set(oauthState, { verifier: codeVerifier, timestamp: Date.now() });

      const queryParams = new URLSearchParams({
        client_id: VERCEL_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile offline_access",
        state: oauthState,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      });

      const authUrl = `https://vercel.com/oauth/authorize?${queryParams.toString()}`;
      return new Response(JSON.stringify({ url: authUrl, state: oauthState }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "exchange-code") {
      // Retrieve the stored code verifier using state
      const stored = state ? codeVerifiers.get(state) : null;
      if (!stored) {
        console.error("No code verifier found for state:", state);
        return new Response(JSON.stringify({ error: "Invalid or expired state. Please try again." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const codeVerifier = stored.verifier;
      codeVerifiers.delete(state); // Single use

      const tokenResponse = await fetch("https://api.vercel.com/login/oauth/token", {
        method: "POST",
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: VERCEL_CLIENT_ID,
          client_secret: VERCEL_CLIENT_SECRET,
          code,
          code_verifier: codeVerifier,
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

      // Get user info
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
