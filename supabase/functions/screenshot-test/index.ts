import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { preview_url } = await req.json();

    if (!preview_url) {
      return new Response(JSON.stringify({ error: 'preview_url is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Capture screenshot using browser-ai API
    const captureUrl = `https://browser-ai.vivorax.online/api/capture?url=${encodeURIComponent(preview_url)}&wait_before_screenshot_ms=5000`;
    
    const captureResponse = await fetch(captureUrl);

    if (!captureResponse.ok) {
      return new Response(JSON.stringify({ error: `Screenshot capture failed: ${captureResponse.status}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the screenshot as base64 (chunk to avoid stack overflow)
    const imageBuffer = await captureResponse.arrayBuffer();
    const bytes = new Uint8Array(imageBuffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    const base64Image = btoa(binary);
    const dataUrl = `data:image/png;base64,${base64Image}`;

    // Now send to AI for analysis
    const VERCEL_AI_KEY = Deno.env.get('VERCEL_AI_API_KEY') || Deno.env.get('LOVABLE_API_KEY')!;

    const analysisResponse = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_AI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a basic QA checker. ONLY check these two things:
1. Did the website load successfully? (not a blank/white page, not an error page)
2. Are there visible UI elements like buttons, text, or navigation?

IMPORTANT: Ignore any watermarks, badges, or "Built by" labels (e.g. "Built by Vivora", "Powered by X"). These are normal and NOT errors.

If the site loaded and has visible elements: {"status": "pass", "message": "Site loaded successfully"}
If the site is blank, shows an error, or has no visible elements: {"status": "fail", "issues": ["description of what's wrong"], "fix_prompt": "The site failed to load properly. Check for build errors or missing components."}

Do NOT analyze design, colors, layout quality, or styling. Only check if it loaded and has content.
RESPOND ONLY WITH JSON.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Check if this website loaded successfully:" },
              { type: "image_url", image_url: { url: dataUrl } }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!analysisResponse.ok) {
      // Return screenshot even if analysis fails
      return new Response(JSON.stringify({ 
        screenshot: dataUrl, 
        analysis: { status: 'pass', message: 'Analysis unavailable' } 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const analysisData = await analysisResponse.json();
    const analysisText = analysisData.choices?.[0]?.message?.content || '{}';
    
    let analysis;
    try {
      // Clean up any markdown wrapping
      const cleaned = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleaned);
    } catch {
      analysis = { status: 'pass', message: analysisText };
    }

    return new Response(JSON.stringify({ screenshot: dataUrl, analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('screenshot-test error:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
