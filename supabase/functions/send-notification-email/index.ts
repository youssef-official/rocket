import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FROM_EMAIL = "Vivora X <no-reply@vivorax.online>";

function welcomeEmailHtml(name: string) {
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:32px 40px;text-align:center;">
          <img src="https://vivorax.online/vivora-logo.png" alt="Vivora X" width="48" style="display:inline-block;margin-bottom:12px;" />
          <h1 style="color:#fff;font-size:22px;margin:0;">Welcome to Vivora X 🎉</h1>
        </td></tr>
        <tr><td style="padding:32px 40px;color:#333;font-size:15px;line-height:1.7;">
          <p style="margin:0 0 16px;">Hey <strong>${name}</strong>,</p>
          <p style="margin:0 0 16px;">Welcome aboard! You've just joined the future of web development. With Vivora X, you can build production-ready web apps just by describing your ideas.</p>
          <p style="margin:0 0 24px;">Dream It. Prompt It. Ship It. ✨</p>
          <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
            <a href="https://vivorax.online" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-weight:600;font-size:15px;">Start Building Now</a>
          </td></tr></table>
        </td></tr>
        <tr><td style="padding:20px 40px;text-align:center;color:#999;font-size:12px;border-top:1px solid #eee;">
          <p style="margin:0;">© ${new Date().getFullYear()} Vivora X · <a href="https://vivorax.online" style="color:#8b5cf6;text-decoration:none;">vivorax.online</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function planUpgradeHtml(name: string, plan: string) {
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:32px 40px;text-align:center;">
          <img src="https://vivorax.online/vivora-logo.png" alt="Vivora X" width="48" style="display:inline-block;margin-bottom:12px;" />
          <h1 style="color:#fff;font-size:22px;margin:0;">Plan Upgraded! 🚀</h1>
        </td></tr>
        <tr><td style="padding:32px 40px;color:#333;font-size:15px;line-height:1.7;">
          <p style="margin:0 0 16px;">Hey <strong>${name}</strong>,</p>
          <p style="margin:0 0 16px;">Congrats! You've successfully upgraded to the <strong style="color:#8b5cf6;">${plan}</strong> plan. You now have access to more credits, advanced features, and premium capabilities.</p>
          <p style="margin:0 0 24px;">Thank you for choosing Vivora X. Let's build something amazing! 💜</p>
          <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
            <a href="https://vivorax.online/dashboard" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-weight:600;font-size:15px;">Go to Dashboard</a>
          </td></tr></table>
        </td></tr>
        <tr><td style="padding:20px 40px;text-align:center;color:#999;font-size:12px;border-top:1px solid #eee;">
          <p style="margin:0;">© ${new Date().getFullYear()} Vivora X · <a href="https://vivorax.online" style="color:#8b5cf6;text-decoration:none;">vivorax.online</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function renewalReminderHtml(name: string, plan: string, daysLeft: number) {
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:32px 40px;text-align:center;">
          <img src="https://vivorax.online/vivora-logo.png" alt="Vivora X" width="48" style="display:inline-block;margin-bottom:12px;" />
          <h1 style="color:#fff;font-size:22px;margin:0;">Renewal Reminder ⏰</h1>
        </td></tr>
        <tr><td style="padding:32px 40px;color:#333;font-size:15px;line-height:1.7;">
          <p style="margin:0 0 16px;">Hey <strong>${name}</strong>,</p>
          <p style="margin:0 0 16px;">Your <strong style="color:#8b5cf6;">${plan}</strong> plan will expire in <strong>${daysLeft} day${daysLeft > 1 ? 's' : ''}</strong>. Renew now to keep your premium features and credits active.</p>
          <p style="margin:0 0 24px;">Don't lose access to your projects and advanced capabilities!</p>
          <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
            <a href="https://vivorax.online/pricing" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-weight:600;font-size:15px;">Renew Now</a>
          </td></tr></table>
        </td></tr>
        <tr><td style="padding:20px 40px;text-align:center;color:#999;font-size:12px;border-top:1px solid #eee;">
          <p style="margin:0;">© ${new Date().getFullYear()} Vivora X · <a href="https://vivorax.online" style="color:#8b5cf6;text-decoration:none;">vivorax.online</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, email, name, plan, daysLeft } = await req.json();

    if (!email || !type) {
      throw new Error("Missing required fields: type, email");
    }

    const userName = name || email.split("@")[0];
    let subject = "";
    let html = "";

    switch (type) {
      case "welcome":
        subject = "Welcome to Vivora X! 🎉";
        html = welcomeEmailHtml(userName);
        break;
      case "plan_upgrade":
        subject = `Congrats! You're now on ${plan || "Pro"} 🚀`;
        html = planUpgradeHtml(userName, plan || "Pro");
        break;
      case "renewal_reminder":
        subject = `Your ${plan || "Pro"} plan expires soon ⏰`;
        html = renewalReminderHtml(userName, plan || "Pro", daysLeft || 3);
        break;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject,
      html,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Email send error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
