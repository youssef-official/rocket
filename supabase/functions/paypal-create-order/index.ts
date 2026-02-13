import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAYPAL_API = "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const clientId = (Deno.env.get("PAYPAL_CLIENT_ID") || "").trim();
  const secret = (Deno.env.get("PAYPAL_SECRET") || "").trim();

  if (!clientId || !secret) {
    throw new Error("PayPal credentials not configured. Please update PAYPAL_CLIENT_ID and PAYPAL_SECRET secrets.");
  }

  console.log(`[PayPal] Authenticating with client ID: ${clientId.substring(0, 8)}... (length: ${clientId.length}), secret length: ${secret.length}`);

  const credentials = btoa(`${clientId}:${secret}`);

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[PayPal] Auth failed [${res.status}]: ${text}`);
    throw new Error(`PayPal authentication failed (${res.status}). Please verify your PAYPAL_CLIENT_ID and PAYPAL_SECRET are correct sandbox credentials. Client ID starts with: ${clientId.substring(0, 12)}`);
  }

  const data = await res.json();
  console.log(`[PayPal] Auth successful, token obtained`);
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plan, price } = await req.json();

    if (!plan || !price) {
      return new Response(JSON.stringify({ error: "Missing plan or price" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getAccessToken();

    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            description: `Vivora X - ${plan} Plan (Monthly)`,
            amount: {
              currency_code: "USD",
              value: price.toString(),
            },
          },
        ],
      }),
    });

    if (!orderRes.ok) {
      const text = await orderRes.text();
      console.error("PayPal create order failed:", text);
      throw new Error(`PayPal order failed [${orderRes.status}]`);
    }

    const order = await orderRes.json();
    console.log(`[PayPal] Order created: ${order.id} for plan: ${plan}`);

    // Extract the approval URL for user redirect
    const approveLink = order.links?.find((l: any) => l.rel === 'approve')?.href || '';

    return new Response(JSON.stringify({ id: order.id, approveUrl: approveLink }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("paypal-create-order error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
