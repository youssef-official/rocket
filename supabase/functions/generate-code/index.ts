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

const CODE_GENERATION_PROMPT = `You are an expert Senior Full-Stack Engineer. You build production-grade React + Tailwind CSS applications.
Output ONLY <FILE path="...">...</FILE> blocks with complete file content. No explanations, no markdown outside FILE blocks.

STRICT RULES:
1. OUTPUT ONLY <FILE> blocks
2. If EDIT request: only modify files related to the request. DO NOT touch unrelated files.
3. If NEW project: generate 8-15+ files minimum with full structure
4. PACKAGES: Only react, lucide-react, framer-motion, clsx, tailwind-merge
5. RESPONSIVE: mobile-first responsive classes on every element
6. BRANDING: index.html MUST include: <script src="https://www.vivorax.online/branding.js" defer></script>
7. DO NOT change design unless explicitly asked

DESIGN PROTECTION (CRITICAL):
- NEVER modify Navbar, Footer, Hero, or any layout component UNLESS the user explicitly asked.
- NEVER change colors, fonts, spacing, or visual style of ANY existing component.
- If adding a new page: create ONLY the page file + update routing. Leave everything else UNTOUCHED.

ANTI-ERROR CHECKLIST:
- NEVER use require(). Always use import/export (ESM only).
- NEVER import something that doesn't exist in the target file.
- ALWAYS use optional chaining for nested property access: obj?.prop ?? fallback
- App.tsx has: export default function App()
- All framer-motion imports include AnimatePresence explicitly
- index.html has <link rel="icon" href="data:," />
- NO exports of contexts/hooks from App.tsx - put them in dedicated files
- Every variable/constant MUST be defined before use
- Every import MUST match a real export in the source file`;

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

        let appendText = `\n\nUSER_LANGUAGE=${userLanguage || 'en'}\n\n⚠️ CRITICAL REQUIREMENTS:
1. OUTPUT ONLY <FILE> blocks (no JSON, no markdown, no explanations)
2. If this is an EDIT request (existing files provided): 
   - READ existing files FIRST and report read actions
   - ONLY modify files directly related to the user's request
   - 🔴 DO NOT change design, layout, colors, fonts, or structure UNLESS EXPLICITLY ASKED
   - Keep ALL existing code intact except the specific change requested
3. If this is a NEW project: Generate 8-15 SEPARATE files minimum
4. PACKAGES: Only react, lucide-react, framer-motion, clsx, tailwind-merge
5. RESPONSIVE: Every element MUST have mobile-first responsive classes
6. BRANDING: index.html MUST include: <script src="https://www.vivorax.online/branding.js" defer></script>
7. GENERATE ALL FILES COMPLETELY - Do not truncate
8. Each component in its OWN separate file

🤖 AI INTEGRATION IN GENERATED PROJECTS:
- When user asks for a chatbot or AI feature:
  - Use the FREE public gateway: https://ai-gateway.vivorax.online/api/ai/generate
  - NO API KEY REQUIRED
  - Simple request format:
    const res = await fetch('https://ai-gateway.vivorax.online/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: userMessage,
        config: { stream: false, temperature: 0.8, max_tokens: 800 }
      })
    });
    const data = await res.json();
    const reply = data.result;

🚫 FORBIDDEN IMPORTS IN GENERATED PROJECTS (WILL BREAK BUILD):
- ❌ NEVER import from "firebase", "@firebase/app", etc.
- Only use localStorage, React state, Supabase, or the AI gateway for data

🚨 ANTI-ERROR CHECKLIST (CHECK BEFORE OUTPUTTING):
- ✅ useLanguage is exported from src/contexts/LanguageContext.tsx ONLY
- ✅ useTheme is exported from src/contexts/ThemeContext.tsx ONLY
- ✅ translations is exported from src/lib/constants.ts ONLY
- ✅ App.tsx has: export default function App() { ... }
- ✅ All framer-motion imports include AnimatePresence explicitly
- ✅ NO exports of utilities/contexts from App.tsx

📸 IMAGE ANALYSIS (when images are attached):
- Analyze each attached image carefully before coding
- Extract layout, hierarchy, colors, spacing, typography, and components
- Recreate/fix the design based on what is visible in the image

🎬 HERO VIDEO BACKGROUNDS (CDN - USE INSTEAD OF VIDEO-PROMPT):
When building websites that need a cinematic hero video background, use these FREE CDN videos directly:
- AI / Machine Learning sites: https://videos-cdn.vivorax.online/ai/hero.mp4
- Business / Corporate sites: https://videos-cdn.vivorax.online/business/hero.mp4
- Education / Learning sites: https://videos-cdn.vivorax.online/education/hero.mp4
- Gaming sites: https://videos-cdn.vivorax.online/gaming/hero.mp4
- Restaurant / Food sites: https://videos-cdn.vivorax.online/resturant/hero.mp4
- Technology / SaaS sites: https://videos-cdn.vivorax.online/technology/hero.mp4

Usage: <video src="https://videos-cdn.vivorax.online/technology/hero.mp4" autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
Choose the MOST RELEVANT category. NEVER use VIDEO-PROMPT comments - they are DEPRECATED.

🚨 THREE.JS REMINDER: NEVER use bare "import * as THREE from 'three'" without an importmap in index.html.`;
        
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
