import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Credit calculation is now done by file count, not AI
const CREDIT_PROMPT = `Return: {"credits":1,"reason":"default","estimated_files":5,"complexity":"medium"}`;

const EXPLANATION_PROMPT = `🌍 LANGUAGE RULE (ABSOLUTE): You MUST reply in the language specified by USER_LANGUAGE. If USER_LANGUAGE=ar → Arabic. If USER_LANGUAGE=en → English. If USER_LANGUAGE=fr → French. If no USER_LANGUAGE is set, reply in the SAME language the user wrote their message in. NEVER reply in a different language than the user used. This is non-negotiable.

You are a senior developer explaining what you built/changed. Be concise and natural — like a real programmer talking to a colleague.

ADAPTIVE LENGTH RULES:
- NEW PROJECT (first version, many files generated): Write 4-6 bullet points describing the main features and sections built. Each point 1-2 sentences. Highlight the key features.
- EDIT/FIX (modifying existing project): Write 1-3 SHORT bullet points ONLY about what was changed. Each point under 15 words. Be minimal.
- SMALL FIX (1-2 files, typo, color change): Write just 1 bullet point.

Rules:
- Only mention what ACTUALLY changed or was built
- Do NOT explain HOW you did it technically
- Do NOT list every single file
- Sound human
- Match the user's tone and language exactly

Format (numbered list, NO XML tags):
1. [What you built/changed]
2. [What you built/changed]
...`;

const PROJECT_NAME_PROMPT = `Generate a creative 2-word project name. Title Case. No quotes or punctuation.
Example: "Nova Dashboard", "Stellar Store", "Pixel Studio"`;

const SUGGESTIONS_PROMPT = `Generate 4 CREATIVE and NON-OBVIOUS feature suggestions as a JSON array.
Only suggest features possible with: react, lucide-react, framer-motion, tailwind.

CRITICAL RULES:
1. The suggestions MUST be in the SAME LANGUAGE as the user's last message.
2. DO NOT suggest generic/obvious features.
3. Instead, suggest features the user probably FORGOT or DIDN'T THINK OF.
4. Each suggestion should feel like expert advice.

You MUST return ONLY this exact JSON format:
[{"label":"short label","prompt":"detailed prompt"},{"label":"short label","prompt":"detailed prompt"},{"label":"short label","prompt":"detailed prompt"},{"label":"short label","prompt":"detailed prompt"}]`;

const CHAT_PROMPT = `You are Vivora X, a friendly Senior Software Engineer.
🌍 LANGUAGE RULE (ABSOLUTE): You MUST reply in the EXACT SAME LANGUAGE as the user's message.
Be helpful, concise, and use the user's language.
Only react, lucide-react, framer-motion, clsx, tailwind-merge are available.
Do NOT suggest unavailable packages.`;

const VERSION_NAME_PROMPT = `Generate a 2-4 word descriptive version name. Title Case.
Examples: "Hero Section Update", "Dark Mode Added", "Mobile Navigation Fix"`;

const STATUS_PROMPT = `Generate ONE ultra-short status (Max 4 words). No emojis. No punctuation.`;

const CODE_GENERATION_PROMPT = `You are VIVORA X, an elite Full-Stack Engineer creating PREMIUM web apps.

RULES:
1. LANGUAGE: Reply in the SAME language as the user's message. USER_LANGUAGE parameter confirms this.
2. IMPORT SAFETY: NEVER import something that doesn't exist. Define data locally if needed. Verify every export.
3. PACKAGES: ONLY react, react-dom, lucide-react, framer-motion, clsx, tailwind-merge. NO react-router-dom, zustand, axios, sonner, @radix-ui, @tanstack.
4. LUCIDE v0.263: Safe icons ONLY: Menu, X, ChevronDown/Up/Left/Right, Arrow*, Search, Plus, Minus, Check, Copy, Edit, Trash2, Download, Upload, Share2, Send, Save, RefreshCw, LogOut, LogIn, Eye, EyeOff, Settings, Filter, Loader2, AlertCircle, Info, Bell, Heart, Star, ShoppingCart, CreditCard, MapPin, Globe, Phone, Mail, MessageSquare, Calendar, Clock, User, Users, Lock, Key, Shield, File, FileText, Folder, Database, Code, Sun, Moon, Zap, Award, TrendingUp, BarChart2, Activity, Home, Image, Play, Grid, Layout, Layers.
   NEVER: CircleUser, PanelLeft, Sparkles, Bot, BrainCircuit, Wand2, ListFilter, BadgeCheck, Blocks, LayoutGrid.
5. NO require(). ESM only. Always optional chaining for nested access.
6. App.tsx MUST: export default function App(). useTheme from contexts/ThemeContext.tsx. useLanguage from contexts/LanguageContext.tsx. translations from lib/constants.ts.
7. DARK/LIGHT mode mandatory. ThemeProvider + localStorage + system preference.
8. DESIGN: Classic premium (Apple/Aesop style). Playfair Display headings, Inter body. No neon gradients. Subtle gold/navy/burgundy accents.
9. ANIMATIONS: framer-motion everywhere. Hero: staggered reveals, parallax (useScroll+useTransform). Sections: useInView+staggerChildren. Buttons: whileHover/whileTap.
10. THREE.JS: Must use importmap in index.html, never bare npm import.

ADMIN DASHBOARD (when requested):
- FULLY FUNCTIONAL, not mockup. Context+useReducer for state. Full CRUD with modals/forms/validation/toasts.
- Pages: Dashboard(real stats), Products(CRUD), Orders(status mgmt), Categories, Users, Settings.
- Sidebar with icons, auth with password login, 5-10 sample items.
- EVERY button must work. No empty handlers.

PROJECT STRUCTURE (new projects): 15-25 files min. index.html, main.tsx, App.tsx, index.css, types/index.ts, contexts/, hooks/, components/ui/, components/, pages/, vercel.json, robots.txt, sitemap.xml.

EDITING: ONLY change what user asked. NEVER touch Navbar/Footer/Hero/colors unless explicitly asked. Read existing files first.

OUTPUT: <FILE> blocks only, then <ACTIONS>, then <SUMMARY>. Each file COMPLETE. index.html must include: <script src="https://www.vivorax.online/branding.js" defer></script>.`;

function getPromptForMode(mode: string): string {
  switch (mode) {
    case "code":
      return CODE_GENERATION_PROMPT;
    case "status":
      return STATUS_PROMPT;
    case "explanation":
      return EXPLANATION_PROMPT;
    case "project-name":
      return PROJECT_NAME_PROMPT;
    case "suggestions":
      return SUGGESTIONS_PROMPT;
    case "chat":
      return CHAT_PROMPT;
    case "version-name":
      return VERSION_NAME_PROMPT;
    case "credit":
      return CREDIT_PROMPT;
    default:
      return CODE_GENERATION_PROMPT;
  }
}

function appendTextToMessageContent(
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>,
  textToAppend: string,
) {
  if (typeof content === "string") {
    return `${content}${textToAppend}`;
  }

  if (Array.isArray(content)) {
    const updated = [...content];
    const firstTextIndex = updated.findIndex((item) => item?.type === "text");

    if (firstTextIndex >= 0) {
      const firstTextBlock = updated[firstTextIndex];
      updated[firstTextIndex] = {
        ...firstTextBlock,
        text: `${firstTextBlock.text ?? ""}${textToAppend}`,
      };
      return updated;
    }

    return [{ type: "text", text: textToAppend.trimStart() }, ...updated];
  }

  return content;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, messages, userPlan, userLanguage, colorTheme } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = getPromptForMode(mode);

    // Enhanced message formatting for code mode
    let finalMessages = messages;
    if (mode === "code" && messages.length > 0) {
      const lastUserMsgIndex = messages.findLastIndex((m: any) => m.role === "user");
      if (lastUserMsgIndex >= 0) {
        finalMessages = [...messages];

        let appendText = `\n\nUSER_LANGUAGE=${userLanguage || 'en'}

REQUIREMENTS:
- OUTPUT: <FILE> blocks only, then <ACTIONS>, then <SUMMARY>
- EDIT mode: Only modify requested files. DO NOT change design/layout/colors unless asked.
- NEW project: 15-25 files minimum. Each component in own file.
- RESPONSIVE + DARK/LIGHT mode mandatory
- BRANDING: index.html must include: <script src="https://www.vivorax.online/branding.js" defer></script>
- AI features: Use https://ai-gateway.vivorax.online/api/ai/generate (free, no key needed)
- HERO VIDEOS: ai|business|education|gaming|resturant|technology → https://videos-cdn.vivorax.online/{category}/hero.mp4
- THREE.JS: importmap in index.html required, never bare npm import
- IMAGES: Analyze attached images and recreate/fix designs accordingly`;
        
        // Add color theme instructions if selected
        if (colorTheme) {
          appendText += `\n\n🎨 COLOR THEME INSTRUCTIONS (MANDATORY):
The user selected the "${colorTheme.name}" color theme. You MUST use these colors as the PRIMARY palette:
- Primary: ${colorTheme.colors[0]}
- Secondary: ${colorTheme.colors[1]}  
- Accent: ${colorTheme.colors[2]}
Apply these colors to: buttons, headings, accents, gradients, hover states, and key UI elements.
Derive darker/lighter shades from these base colors for backgrounds and text.`;
        }

        finalMessages[lastUserMsgIndex] = {
          ...finalMessages[lastUserMsgIndex],
          content: appendTextToMessageContent(
            finalMessages[lastUserMsgIndex].content,
            appendText,
          ),
        };
      }
    }

    // Inject language into explanation mode
    if (mode === "explanation" && userLanguage && messages.length > 0) {
      const lastIdx = messages.findLastIndex((m: any) => m.role === "user");
      if (lastIdx >= 0) {
        finalMessages = [...messages];
        finalMessages[lastIdx] = {
          ...finalMessages[lastIdx],
          content: appendTextToMessageContent(
            finalMessages[lastIdx].content,
            `\n\nIMPORTANT: Reply in ${userLanguage === 'ar' ? 'Arabic' : userLanguage === 'fr' ? 'French' : userLanguage === 'es' ? 'Spanish' : 'English'}.`,
          ),
        };
      }
    }

    console.log(`[generate-code] Mode: ${mode}, Messages: ${messages.length}, userPlan: "${userPlan}"`);

    // Determine max tokens based on mode
    const maxTokens =
      mode === "code"
        ? 65000
        : mode === "project-name" || mode === "version-name"
          ? 100
          : mode === "suggestions"
            ? 800
            : mode === "credit"
              ? 200
              : mode === "explanation"
                ? 2000
                : 8000;

    // Use non-streaming for credit mode (need JSON response)
    const shouldStream = mode !== "credit";

    // ═══════════════════════════════════════════════════════════════════
    // DYNAMIC MODEL CONFIG FROM DATABASE (SERVER-SIDE PLAN VERIFICATION)
    // ═══════════════════════════════════════════════════════════════════
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    let model = "google/gemini-3-flash";
    let gatewayUrl = "https://ai-gateway.vercel.sh/v1/chat/completions";
    let apiKeySecretName = "VERCEL_AI_API_KEY";

    // SECURITY: Verify user's actual plan from database
    let verifiedPlan = 'free';
    try {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const token = authHeader.replace('Bearer ', '');
        const { data: authData } = await supabaseAdmin.auth.getUser(token);
        
        if (authData?.user?.id) {
          const { data: planRow } = await supabaseAdmin
            .from('user_plans')
            .select('plan, subscription_expires_at')
            .eq('user_id', authData.user.id)
            .single();
          
          if (planRow) {
            if (planRow.plan === 'pro' || planRow.plan === 'business') {
              if (planRow.subscription_expires_at && new Date(planRow.subscription_expires_at) <= new Date()) {
                verifiedPlan = 'free';
              } else {
                verifiedPlan = planRow.plan;
              }
            }
          }
        }
      }
    } catch (authErr) {
      console.warn("[generate-code] Plan verification failed, defaulting to free:", authErr);
    }

    console.log(`[generate-code] Verified plan: ${verifiedPlan} (client sent: ${userPlan})`);

    try {
      const configRes = await fetch(
        `${SUPABASE_URL}/rest/v1/ai_model_config?is_active=eq.true&or=(target_plan.eq.${verifiedPlan},target_plan.eq.all)`,
        {
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
        }
      );
      if (configRes.ok) {
        const configs = await configRes.json();
        if (configs && configs.length > 0) {
          const specificMatch = configs.find((c: any) => c.target_plan === verifiedPlan);
          const cfg = specificMatch || configs[0];
          model = cfg.model_id;
          gatewayUrl = cfg.gateway_url;
          apiKeySecretName = cfg.api_key_secret_name;
          console.log(`[generate-code] Using model: ${model} (provider: ${cfg.provider}, target: ${cfg.target_plan}, verified: ${verifiedPlan})`);
        }
      }
    } catch (cfgErr) {
      console.warn("[generate-code] Failed to fetch model config, using defaults:", cfgErr);
    }

    const authToken = Deno.env.get(apiKeySecretName) || Deno.env.get("VERCEL_AI_API_KEY") || LOVABLE_API_KEY;

    const response = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: systemPrompt }, ...finalMessages],
        stream: shouldStream,
        max_tokens: maxTokens,
        temperature: mode === "code" ? 0.1 : mode === "credit" ? 0 : 0.4,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For credit mode, return JSON directly
    if (!shouldStream) {
      const data = await response.json();
      const content =
        data.choices?.[0]?.message?.content ??
        '{"credits":1,"reason":"default","estimated_files":5,"complexity":"medium"}';
      return new Response(content, {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-code error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
