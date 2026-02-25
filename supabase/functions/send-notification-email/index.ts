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

const BRAND = {
  logo: "https://vivorax.online/vivora-logo.png",
  site: "https://vivorax.online",
  purple: "#8b5cf6",
  pink: "#ec4899",
  dark: "#0f0f23",
  darkCard: "#1a1a2e",
  gray: "#94a3b8",
  year: new Date().getFullYear(),
};

function emailShell(title: string, preheader: string, content: string) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <meta name="color-scheme" content="light"/>
  <meta name="supported-color-schemes" content="light"/>
  <title>${title}</title>
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; -webkit-font-smoothing:antialiased; }
    img { border:0; display:block; outline:none; text-decoration:none; }
    a { color:${BRAND.purple}; text-decoration:none; }
    @media only screen and (max-width:600px) {
      .outer { width:100% !important; padding:16px !important; }
      .inner { width:100% !important; padding:24px 20px !important; }
      .hero-title { font-size:24px !important; }
      .cta-btn { padding:14px 28px !important; font-size:14px !important; }
      .icon-circle { width:64px !important; height:64px !important; }
      .icon-circle img { width:32px !important; height:32px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;width:100%;">
  <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr><td align="center" class="outer" style="padding:40px 20px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" class="inner" style="background:${BRAND.darkCard};border-radius:20px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
        <!-- Logo Header -->
        <tr><td style="background:linear-gradient(135deg,${BRAND.dark},${BRAND.darkCard});padding:32px 40px 24px;text-align:center;">
          <a href="${BRAND.site}" target="_blank">
            <img src="${BRAND.logo}" alt="Vivora X" width="56" height="56" style="margin:0 auto 16px;border-radius:14px;" />
          </a>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td height="1" style="background:linear-gradient(90deg,transparent,${BRAND.purple},${BRAND.pink},transparent);"></td></tr>
          </table>
        </td></tr>
        <!-- Content -->
        ${content}
        <!-- Footer -->
        <tr><td style="padding:24px 40px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
            <tr>
              <td style="padding:0 8px;"><a href="${BRAND.site}" style="color:${BRAND.gray};font-size:12px;">Website</a></td>
              <td style="color:rgba(255,255,255,0.15);font-size:12px;">•</td>
              <td style="padding:0 8px;"><a href="${BRAND.site}/pricing" style="color:${BRAND.gray};font-size:12px;">Pricing</a></td>
              <td style="color:rgba(255,255,255,0.15);font-size:12px;">•</td>
              <td style="padding:0 8px;"><a href="${BRAND.site}/docs" style="color:${BRAND.gray};font-size:12px;">Docs</a></td>
            </tr>
          </table>
          <p style="margin:0;color:rgba(255,255,255,0.3);font-size:11px;line-height:1.5;">
            © ${BRAND.year} Vivora X · Dream It. Prompt It. Ship It.<br/>
            <a href="${BRAND.site}" style="color:rgba(255,255,255,0.4);">vivorax.online</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function ctaButton(text: string, href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding:8px 0 0;">
    <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}" style="height:50px;v-text-anchor:middle;width:220px;" arcsize="50%" fill="true" stroke="false"><v:fill type="gradient" color="${BRAND.purple}" color2="${BRAND.pink}" angle="135"/><v:textbox inset="0,0,0,0"><center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:600;">${text}</center></v:textbox></v:roundrect><![endif]-->
    <!--[if !mso]><!-->
    <a href="${href}" target="_blank" class="cta-btn" style="display:inline-block;background:linear-gradient(135deg,${BRAND.purple},${BRAND.pink});color:#ffffff;text-decoration:none;padding:15px 40px;border-radius:50px;font-weight:600;font-size:15px;letter-spacing:0.3px;box-shadow:0 8px 24px rgba(139,92,246,0.35);">
      ${text}
    </a>
    <!--<![endif]-->
  </td></tr></table>`;
}

function welcomeEmailHtml(name: string) {
  return emailShell("Welcome to Vivora X!", `Hey ${name}, welcome to the future of web development!`, `
    <tr><td style="padding:32px 40px 8px;text-align:center;">
      <div class="icon-circle" style="width:80px;height:80px;margin:0 auto 20px;background:linear-gradient(135deg,${BRAND.purple},${BRAND.pink});border-radius:50%;display:flex;align-items:center;justify-content:center;">
        <img src="${BRAND.logo}" alt="" width="44" height="44" style="margin:18px auto;border-radius:10px;" />
      </div>
      <h1 class="hero-title" style="color:#ffffff;font-size:28px;font-weight:700;margin:0 0 8px;">Welcome aboard! 🎉</h1>
      <p style="color:${BRAND.gray};font-size:15px;line-height:1.6;margin:0;">You've just joined the future of web development</p>
    </td></tr>
    <tr><td style="padding:24px 40px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border-radius:14px;border:1px solid rgba(255,255,255,0.06);">
        <tr><td style="padding:24px 28px;">
          <p style="color:#e2e8f0;font-size:15px;line-height:1.7;margin:0 0 16px;">
            Hey <strong style="color:#fff;">${name}</strong>,
          </p>
          <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0 0 12px;">
            With <strong style="color:${BRAND.purple};">Vivora X</strong>, you can build production-ready web apps just by describing your ideas. No coding experience needed.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;">
            <tr><td style="padding:6px 0;color:#94a3b8;font-size:13px;">✨ AI-powered code generation</td></tr>
            <tr><td style="padding:6px 0;color:#94a3b8;font-size:13px;">🎨 Clone any website design instantly</td></tr>
            <tr><td style="padding:6px 0;color:#94a3b8;font-size:13px;">🚀 One-click deploy to production</td></tr>
            <tr><td style="padding:6px 0;color:#94a3b8;font-size:13px;">🔗 GitHub & Vercel integrations</td></tr>
          </table>
        </td></tr>
      </table>
      <div style="padding-top:24px;">
        ${ctaButton("Start Building Now →", BRAND.site)}
      </div>
    </td></tr>
  `);
}

function planUpgradeHtml(name: string, plan: string) {
  return emailShell(`Upgraded to ${plan}!`, `Congrats ${name}! You're now on the ${plan} plan.`, `
    <tr><td style="padding:32px 40px 8px;text-align:center;">
      <div class="icon-circle" style="width:80px;height:80px;margin:0 auto 20px;background:linear-gradient(135deg,#f59e0b,${BRAND.pink});border-radius:50%;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:36px;line-height:80px;">🚀</span>
      </div>
      <h1 class="hero-title" style="color:#ffffff;font-size:28px;font-weight:700;margin:0 0 8px;">Plan Upgraded!</h1>
      <p style="color:${BRAND.gray};font-size:15px;line-height:1.6;margin:0;">You've unlocked premium capabilities</p>
    </td></tr>
    <tr><td style="padding:24px 40px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border-radius:14px;border:1px solid rgba(255,255,255,0.06);">
        <tr><td style="padding:24px 28px;">
          <p style="color:#e2e8f0;font-size:15px;line-height:1.7;margin:0 0 16px;">
            Hey <strong style="color:#fff;">${name}</strong>,
          </p>
          <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0 0 12px;">
            Congrats! 🎉 You've successfully upgraded to the <strong style="color:${BRAND.purple};">${plan}</strong> plan. Here's what you've unlocked:
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
            <tr>
              <td width="50%" style="padding:8px;">
                <div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.2);border-radius:10px;padding:16px;text-align:center;">
                  <div style="font-size:20px;margin-bottom:4px;">⚡</div>
                  <div style="color:#e2e8f0;font-size:12px;font-weight:600;">More Credits</div>
                </div>
              </td>
              <td width="50%" style="padding:8px;">
                <div style="background:rgba(236,72,153,0.1);border:1px solid rgba(236,72,153,0.2);border-radius:10px;padding:16px;text-align:center;">
                  <div style="font-size:20px;margin-bottom:4px;">🧠</div>
                  <div style="color:#e2e8f0;font-size:12px;font-weight:600;">Advanced AI</div>
                </div>
              </td>
            </tr>
            <tr>
              <td width="50%" style="padding:8px;">
                <div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);border-radius:10px;padding:16px;text-align:center;">
                  <div style="font-size:20px;margin-bottom:4px;">📦</div>
                  <div style="color:#e2e8f0;font-size:12px;font-weight:600;">ZIP Export</div>
                </div>
              </td>
              <td width="50%" style="padding:8px;">
                <div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:10px;padding:16px;text-align:center;">
                  <div style="font-size:20px;margin-bottom:4px;">💎</div>
                  <div style="color:#e2e8f0;font-size:12px;font-weight:600;">Premium Features</div>
                </div>
              </td>
            </tr>
          </table>
          <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:16px 0 0;">
            Thank you for choosing Vivora X. Let's build something amazing! 💜
          </p>
        </td></tr>
      </table>
      <div style="padding-top:24px;">
        ${ctaButton("Go to Dashboard →", BRAND.site + "/dashboard")}
      </div>
    </td></tr>
  `);
}

function renewalReminderHtml(name: string, plan: string, daysLeft: number) {
  const urgencyColor = daysLeft <= 1 ? "#ef4444" : daysLeft <= 3 ? "#f59e0b" : BRAND.purple;
  return emailShell("Renewal Reminder", `Your ${plan} plan expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}.`, `
    <tr><td style="padding:32px 40px 8px;text-align:center;">
      <div class="icon-circle" style="width:80px;height:80px;margin:0 auto 20px;background:linear-gradient(135deg,${urgencyColor},${BRAND.pink});border-radius:50%;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:36px;line-height:80px;">⏰</span>
      </div>
      <h1 class="hero-title" style="color:#ffffff;font-size:28px;font-weight:700;margin:0 0 8px;">Renewal Reminder</h1>
      <p style="color:${BRAND.gray};font-size:15px;line-height:1.6;margin:0;">Don't lose your premium features</p>
    </td></tr>
    <tr><td style="padding:24px 40px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border-radius:14px;border:1px solid rgba(255,255,255,0.06);">
        <tr><td style="padding:24px 28px;">
          <p style="color:#e2e8f0;font-size:15px;line-height:1.7;margin:0 0 16px;">
            Hey <strong style="color:#fff;">${name}</strong>,
          </p>
          <!-- Countdown Badge -->
          <div style="text-align:center;margin:16px 0 20px;">
            <div style="display:inline-block;background:linear-gradient(135deg,rgba(${daysLeft <= 1 ? '239,68,68' : daysLeft <= 3 ? '245,158,11' : '139,92,246'},0.15),rgba(236,72,153,0.1));border:1px solid ${urgencyColor}40;border-radius:14px;padding:20px 32px;">
              <div style="color:${urgencyColor};font-size:36px;font-weight:700;line-height:1;">${daysLeft}</div>
              <div style="color:${BRAND.gray};font-size:12px;font-weight:500;margin-top:4px;">day${daysLeft > 1 ? 's' : ''} remaining</div>
            </div>
          </div>
          <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0 0 12px;">
            Your <strong style="color:${BRAND.purple};">${plan}</strong> plan expires soon. Renew now to keep access to:
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px 0;">
            <tr><td style="padding:5px 0;color:#94a3b8;font-size:13px;">✅ All your premium credits</td></tr>
            <tr><td style="padding:5px 0;color:#94a3b8;font-size:13px;">✅ Advanced AI models</td></tr>
            <tr><td style="padding:5px 0;color:#94a3b8;font-size:13px;">✅ Code editing & ZIP export</td></tr>
            <tr><td style="padding:5px 0;color:#94a3b8;font-size:13px;">✅ Priority support</td></tr>
          </table>
        </td></tr>
      </table>
      <div style="padding-top:24px;">
        ${ctaButton("Renew Now →", BRAND.site + "/pricing")}
      </div>
    </td></tr>
  `);
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
