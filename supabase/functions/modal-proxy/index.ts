import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODAL_URL = Deno.env.get("MODAL_API_URL") || "";
const CUSTOM_PREVIEW_DOMAIN = "vivorax.online";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!MODAL_URL) {
      return new Response(
        JSON.stringify({ error: "MODAL_API_URL not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body for project_id
    let projectId = "";
    try {
      const body = await req.json();
      projectId = body.project_id || "";
    } catch {
      // No body or invalid JSON - projectId stays empty
    }

    // Forward the POST to Modal's create-sandbox endpoint
    console.log("Fetching Modal URL:", MODAL_URL);
    const response = await fetch(MODAL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    console.log("Modal response status:", response.status);

    const data = await response.text();
    console.log("Modal response body:", data.substring(0, 500));

    if (!response.ok) {
      return new Response(data, {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the Modal response
    const modalData = JSON.parse(data);
    const { sandbox_id, api_url, preview_url } = modalData;

    // Use project_id as the subdomain key if provided, otherwise fall back to sandbox_id
    const subdomainKey = projectId || sandbox_id;

    // Save mapping to Supabase using service role
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Upsert using the subdomain key (project_id or sandbox_id)
        // This ensures reconnections update the same row
        await supabase.from("sandbox_mappings").upsert({
          sandbox_id: subdomainKey.toLowerCase(),
          preview_url,
          api_url,
          project_id: projectId || null,
        }, { onConflict: "sandbox_id" });
        
        console.log("Saved sandbox mapping:", subdomainKey, "-> preview:", preview_url);
      }
    } catch (dbError) {
      console.error("Failed to save sandbox mapping (non-fatal):", dbError);
    }

    // Return response with custom domain URL using the stable subdomain
    const customPreviewUrl = `https://${subdomainKey.toLowerCase()}.${CUSTOM_PREVIEW_DOMAIN}`;
    
    const enrichedResponse = {
      ...modalData,
      preview_url, // Keep original for fallback
      custom_preview_url: customPreviewUrl,
    };

    return new Response(JSON.stringify(enrichedResponse), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Modal proxy error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
