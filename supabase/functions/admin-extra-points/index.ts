import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, target_plan, points, unlimited, expires_at } = await req.json();

    if (action === "add_points") {
      // Build filter
      let query = adminClient.from("user_plans").select("id, user_id, daily_credits, max_daily_credits");
      if (target_plan && target_plan !== "all") {
        query = query.eq("plan", target_plan);
      }
      const { data: plans, error: plansErr } = await query;
      if (plansErr) throw plansErr;

      if (!plans || plans.length === 0) {
        return new Response(JSON.stringify({ error: "No users found for this plan", updated: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const ids = plans.map((p: any) => p.id);

      if (unlimited) {
        // Set a very high number for unlimited
        const { error: updateErr } = await adminClient
          .from("user_plans")
          .update({ daily_credits: 9999, max_daily_credits: 9999 })
          .in("id", ids);
        if (updateErr) throw updateErr;
      } else {
        // Add points to daily_credits
        for (const plan of plans) {
          const newCredits = Number(plan.daily_credits) + Number(points);
          const newMax = Number(plan.max_daily_credits) + Number(points);
          await adminClient
            .from("user_plans")
            .update({ daily_credits: newCredits, max_daily_credits: newMax })
            .eq("id", plan.id);
        }
      }

      return new Response(
        JSON.stringify({ success: true, updated: ids.length, unlimited: !!unlimited }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reset_points") {
      // Reset to plan defaults
      const defaults: Record<string, number> = { free: 3, pro: 5, business: 10 };
      let query = adminClient.from("user_plans").select("id, plan");
      if (target_plan && target_plan !== "all") {
        query = query.eq("plan", target_plan);
      }
      const { data: plans } = await query;
      if (plans) {
        for (const plan of plans) {
          const def = defaults[plan.plan] || 3;
          await adminClient
            .from("user_plans")
            .update({ daily_credits: def, max_daily_credits: def })
            .eq("id", plan.id);
        }
      }
      return new Response(
        JSON.stringify({ success: true, updated: plans?.length || 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-extra-points error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
