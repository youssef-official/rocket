import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, aspect_ratio } = await req.json();
    const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN");

    if (!REPLICATE_API_TOKEN) {
      return new Response(
        JSON.stringify({ error: "REPLICATE_API_TOKEN is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[generate-video] Starting video generation: "${prompt.substring(0, 80)}..."`);

    // Create prediction on Replicate
    const createRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({
        version: "luma/ray",
        input: {
          prompt: prompt,
          aspect_ratio: aspect_ratio || "16:9",
          loop: true,
        },
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error("[generate-video] Replicate create error:", createRes.status, errText);
      return new Response(
        JSON.stringify({ error: "Failed to start video generation", detail: errText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prediction = await createRes.json();
    console.log(`[generate-video] Prediction created: ${prediction.id}, status: ${prediction.status}`);

    // If "Prefer: wait" worked, the prediction may already be complete
    if (prediction.status === "succeeded" && prediction.output) {
      return new Response(
        JSON.stringify({ 
          status: "succeeded",
          video_url: prediction.output,
          prediction_id: prediction.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Otherwise poll for completion (max 120 seconds)
    const pollUrl = `https://api.replicate.com/v1/predictions/${prediction.id}`;
    const maxAttempts = 60;
    
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pollRes = await fetch(pollUrl, {
        headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
      });
      
      if (!pollRes.ok) continue;
      
      const pollData = await pollRes.json();
      console.log(`[generate-video] Poll ${i + 1}: status=${pollData.status}`);

      if (pollData.status === "succeeded") {
        return new Response(
          JSON.stringify({
            status: "succeeded",
            video_url: pollData.output,
            prediction_id: pollData.id,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (pollData.status === "failed" || pollData.status === "canceled") {
        return new Response(
          JSON.stringify({
            status: pollData.status,
            error: pollData.error || "Video generation failed",
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Timeout - return prediction ID for client to poll
    return new Response(
      JSON.stringify({
        status: "processing",
        prediction_id: prediction.id,
        message: "Video is still generating. Use prediction_id to check status.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error("[generate-video] Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
