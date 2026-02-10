import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAYPAL_API = "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const secret = Deno.env.get("PAYPAL_SECRET");

  if (!clientId || !secret) {
    throw new Error("PayPal credentials not configured");
  }

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${secret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal auth failed [${res.status}]: ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, plan, userId } = await req.json();

    if (!orderId || !plan || !userId) {
      return new Response(JSON.stringify({ error: "Missing orderId, plan, or userId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getAccessToken();

    const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!captureRes.ok) {
      const text = await captureRes.text();
      console.error("PayPal capture failed:", text);
      throw new Error(`PayPal capture failed [${captureRes.status}]`);
    }

    const capture = await captureRes.json();
    console.log(`[PayPal] Order captured: ${orderId}, status: ${capture.status}`);

    if (capture.status === "COMPLETED") {
      // Upgrade user plan in database
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const planCredits: Record<string, { daily: number; monthly: number; max: number }> = {
        builder: { daily: 5, monthly: 100, max: 25 },
        creator: { daily: 5, monthly: 300, max: 25 },
        scale: { daily: 5, monthly: 700, max: 25 },
      };

      const credits = planCredits[plan];
      if (credits) {
        const { error } = await supabase
          .from("user_plans")
          .update({
            plan: plan,
            daily_credits: credits.daily,
            max_daily_credits: credits.max,
            monthly_credits: credits.monthly,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (error) {
          console.error("Failed to update user plan:", error);
          throw new Error("Payment captured but plan update failed");
        }

        console.log(`[PayPal] User ${userId} upgraded to ${plan}`);
      }
    }

    return new Response(JSON.stringify({ status: capture.status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("paypal-capture-order error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
