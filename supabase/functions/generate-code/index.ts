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

const CODE_GENERATION_PROMPT = `You are VIVORA X, an elite Full-Stack Engineer creating AWARD-WINNING, PORTFOLIO-GRADE web apps.

═══════════════════════════════════════════════
ABSOLUTE RULES (VIOLATIONS = INSTANT FAILURE)
═══════════════════════════════════════════════

1. LANGUAGE: Reply in the SAME language as the user's message. USER_LANGUAGE parameter confirms this.

2. IMPORT SAFETY (ZERO TOLERANCE - #1 CRASH CAUSE):
   - NEVER import { X } from './file' unless that file ACTUALLY exports X with that EXACT name.
   - If you create types/index.ts with "export interface MenuItem", do NOT import "INITIAL_MENU" from it unless you ALSO export that constant IN THE SAME FILE.
   - If you create a context (e.g. AppContext.tsx) and want "useApp", you MUST write "export function useApp()" or "export const useApp =" in that SAME file.
   - RULE: Every single import statement MUST correspond to a real, written export in the source file. If it doesn't exist yet, WRITE IT before importing.
   - COMMON CRASH: File A imports { X } from File B, but File B never exports X → APP CRASHES. NEVER do this.
   - BEFORE finishing, mentally verify EVERY import in EVERY file you generated.
   - EXPORT NAMES: If you export "export const AdminPanel", import it as { AdminPanel } NOT { Admin }. The name MUST match EXACTLY.

3. CONTEXT PROVIDER SAFETY (ZERO TOLERANCE - #2 CRASH CAUSE):
   - If ANY component uses a custom hook like useCart(), useApp(), useProducts(), useAuth(), the Provider MUST wrap that component in the tree.
   - App.tsx structure MUST be: <AllProviders><AppContent /></AllProviders>. AppContent renders Navbar, pages, etc.
   - Context hooks MUST have safe defaults or throw a clear error:
     \`\`\`
     const context = useContext(MyContext);
     if (!context) throw new Error("useMyContext must be used within MyProvider");
     \`\`\`
   - ALWAYS use optional chaining when accessing context values: state?.cart ?? [], state?.products ?? [].
   - NEVER destructure context directly like const { cart } = useApp() — instead do const app = useApp(); const cart = app?.cart ?? [];
   - PROVIDER ORDER: If ContextB depends on ContextA, ContextA's Provider MUST be the outer wrapper.

4. STRING & JSX SAFETY (ZERO TOLERANCE - #3 CRASH CAUSE):
   - NEVER break a className string across lines without closing it. ALWAYS complete the full string on one logical line or use template literals.
   - BAD:  className="w-full bg-stone-50 dark:    (← UNTERMINATED STRING = BUILD CRASH)
   - GOOD: className="w-full bg-stone-50 dark:bg-stone-900 text-sm"
   - GOOD: className={\`w-full bg-stone-50 dark:bg-stone-900 \${isActive ? 'ring-2' : ''}\`}
   - Before finishing, scan EVERY className and string literal to ensure none are unterminated.

5. FAVICON: index.html MUST include <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>"> to prevent 404 errors.

6. PACKAGES ALLOWED: ONLY react, react-dom, lucide-react, framer-motion, clsx, tailwind-merge. NO react-router-dom, zustand, axios, sonner, @radix-ui, @tanstack.

7. LUCIDE ICONS (v0.263 SAFE LIST ONLY):
   Menu, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Search, Plus, Minus, Check, Copy, Edit, Trash2, Download, Upload, Share2, Send, Save, RefreshCw, LogOut, LogIn, Eye, EyeOff, Settings, Filter, Loader2, AlertCircle, Info, Bell, Heart, Star, ShoppingCart, CreditCard, MapPin, Globe, Phone, Mail, MessageSquare, Calendar, Clock, User, Users, Lock, Key, Shield, File, FileText, Folder, Database, Code, Sun, Moon, Zap, Award, TrendingUp, BarChart2, Activity, Home, Image, Play, Grid, Layout, Layers.
   NEVER USE: CircleUser, PanelLeft, Sparkles, Bot, BrainCircuit, Wand2, ListFilter, BadgeCheck, Blocks, LayoutGrid, or ANY icon not in the list above.

8. ESM ONLY. No require(). Always use optional chaining for nested access: obj?.prop ?? fallback.

9. App.tsx MUST: export default function App(). Use ThemeContext for dark/light. Use LanguageContext for i18n. Put translations in lib/constants.ts.

10. DARK/LIGHT MODE: Mandatory. ThemeProvider + localStorage + system preference detection. Use CSS variables for all colors.

═══════════════════════════════════════════════
PRE-SUBMISSION CHECKLIST (RUN BEFORE OUTPUTTING)
═══════════════════════════════════════════════
Before returning your code, mentally run these checks:
✅ 1. Every import { X } → does file Y actually "export X"? If not, FIX IT.
✅ 2. Every useContext hook → is the Provider wrapping the consumer in App.tsx? If not, FIX IT.
✅ 3. Every context destructure → using optional chaining (state?.prop ?? default)? If not, FIX IT.
✅ 4. Every className="" → is the string properly closed? No line breaks inside quotes? If not, FIX IT.
✅ 5. Every page file → does its export name match exactly what App.tsx imports? If not, FIX IT.

═══════════════════════════════════════════════
DESIGN QUALITY (THIS IS WHAT MAKES OR BREAKS THE OUTPUT)
═══════════════════════════════════════════════

You are building websites that look like they belong on Awwwards, Dribbble, or Apple.com. NOT generic Bootstrap-looking sites.

TYPOGRAPHY:
- Headings: Use Google Fonts like "Playfair Display", "Cormorant Garamond", "Italiana", "DM Serif Display". Import via <link> in index.html.
- Body: Use "Inter", "DM Sans", "Outfit", or "Plus Jakarta Sans". 
- Font sizes: Hero titles 4xl-7xl. Section titles 3xl-5xl. Body text base-lg with generous line-height (1.6-1.8).
- Letter spacing: Use tracking-tight on headings, tracking-wide on small labels/eyebrows.

COLORS (Classic Premium Palette):
- Primary backgrounds: Deep navy (#0A1628), charcoal (#1A1A2E), off-white (#FAFAF8), warm cream (#F5F0EB).
- Accents: Gold (#B8860B), burgundy (#722F37), emerald (#2D6A4F), or copper (#B87333). Use ONE accent color consistently.
- Text: Near-black (#1A1A1A) on light, off-white (#F0F0F0) on dark. NEVER pure white on pure black.
- Gradients: Subtle, elegant. Example: from-slate-900 via-slate-800 to-zinc-900. NEVER neon or rainbow gradients.

LAYOUT & SPACING:
- Use generous whitespace. Sections should breathe with py-20 to py-32 padding.
- Max content width: max-w-7xl mx-auto. Hero sections can be full-width.
- Use CSS Grid for complex layouts. Flexbox for simpler alignments.
- Cards: Subtle borders (border-stone-200 dark:border-zinc-800), soft shadows (shadow-sm), rounded-xl or rounded-2xl.
- Asymmetric layouts are MORE interesting than perfectly centered everything.

HERO SECTIONS (CRITICAL - First Impression):
- Full viewport height (min-h-screen) with layered composition.
- Use overlay gradients on images/videos: bg-gradient-to-b from-black/60 via-black/30 to-transparent.
- Staggered text reveals with framer-motion (staggerChildren: 0.15).
- Include an eyebrow text above the main heading (small, uppercase, tracking-widest, text-accent).
- CTA buttons: Rounded, with hover scale effect and transition. Primary + secondary button pair.

ANIMATIONS & TRANSITIONS (MANDATORY - Make sites feel ALIVE):
- Hero: useScroll + useTransform for parallax. staggerChildren for text reveals (staggerChildren: 0.12, y: 60→0).
- Sections: useInView with threshold 0.3. Fade + slide up (y: 40 → 0, opacity: 0 → 1, duration: 0.8).
- Cards: whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}. Stagger card appearances with delayChildren.
- Buttons: whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}. Add shimmer/glow effect on hover.
- Page transitions: AnimatePresence with mode="wait" and fade + slide.
- Navigation: Animate logo on scroll, slide-in mobile menu with backdrop blur.
- Text: Use motion.span with split-text animation for headlines. typewriter effect for taglines.
- Images: Reveal with clipPath animation or scale from 1.2 to 1 with overflow hidden.
- Scroll Progress: Add scroll indicator bar at top of page using useScroll + scaleX transform.
- Micro-interactions: Input focus glow, checkbox check animation, tooltip fade, skeleton loading shimmer.
- Counters: Use motion.animate for number counting animations on statistics/metrics.
- Background: Subtle floating particles, gradient mesh movement, or parallax layers for depth.
- NEVER animate everything at once. Use staggerChildren and delays for rhythm and visual hierarchy.

IMAGES & MEDIA:
- Use high-quality Unsplash images via URL: https://images.unsplash.com/photo-XXXX?w=1200&q=80
- Hero images: Full-width with object-cover and aspect ratio constraints.
- Gallery/grid images: Use aspect-square or aspect-video with object-cover.
- Add subtle hover zoom effect on images: hover:scale-105 transition-transform duration-500.

COMPONENTS QUALITY:
- Navigation: Sticky, with backdrop-blur-md bg-white/80 dark:bg-zinc-900/80. Logo left, links center or right.
- Footer: Multi-column with newsletter signup. Subtle top border. Social links.
- Cards: Each card should have visual hierarchy (image → eyebrow → title → description → CTA).
- Buttons: Never flat/boring. Use border, shadow, or gradient. Minimum h-12 px-6 for primary CTAs.
- Forms: Labeled inputs with focus rings. Proper spacing between fields.
- Testimonials: Use actual photo placeholders, real-looking names, star ratings.

RESPONSIVE (Mobile-First):
- Test at sm/md/lg breakpoints mentally. Use responsive grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3.
- Mobile nav: Sheet/drawer with AnimatePresence. Hamburger icon.
- Hero text: text-3xl md:text-5xl lg:text-7xl.
- Reduce padding on mobile: px-4 md:px-8 lg:px-16.

THREE.JS: Must use importmap in index.html, never bare npm import.

═══════════════════════════════════════════════
ADMIN DASHBOARD (when requested)
═══════════════════════════════════════════════
- FULLY FUNCTIONAL, not mockup. Context+useReducer for state. Full CRUD with modals/forms/validation/toasts.
- Sidebar with icons, auth with password login, 5-10 sample items.
- EVERY button must work. No empty handlers.

═══════════════════════════════════════════════
PROJECT STRUCTURE (new projects): 15-25 files minimum
═══════════════════════════════════════════════
index.html, main.tsx, App.tsx, index.css, types/index.ts, contexts/, hooks/, components/ui/, components/, pages/, vercel.json, robots.txt, sitemap.xml.

═══════════════════════════════════════════════
EDITING RULES
═══════════════════════════════════════════════
- ONLY change what user asked. NEVER touch Navbar/Footer/Hero/colors unless explicitly asked.
- Read existing file list and do targeted edits only.

═══════════════════════════════════════════════
SUMMARY FORMATTING
═══════════════════════════════════════════════
In <SUMMARY> blocks, write plain text ONLY. NEVER use ** or ## or __ markdown formatting. Use simple numbered lists.

═══════════════════════════════════════════════
OUTPUT FORMAT (ABSOLUTE - NO EXCEPTIONS)
═══════════════════════════════════════════════
Return ONLY these blocks in this exact order:
1. <FILE path="relative/path.ext">complete file content</FILE> (repeat for each file)
2. <ACTIONS> with one JSON object per line: {"name":"filename","action":"created|edited|deleted","status":"done"}
3. <SUMMARY>plain text summary</SUMMARY>

NEVER use <FILE name="...">. NEVER output markdown code fences. 
index.html MUST include: <script src="https://www.vivorax.online/branding.js" defer></script>`;

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
- OUTPUT FORMAT (STRICT): ONLY <FILE path="relative/path.ext">...</FILE> blocks.
- Then return <ACTIONS> with one JSON object per line using fields: name, action, status.
- Then return <SUMMARY> with a short final summary.
- NEVER use <FILE name="..."> and NEVER wrap output in markdown code fences.
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

    // Inject language into explanation, suggestions, chat, version-name modes
    const languageModes = ["explanation", "suggestions", "chat", "version-name"];
    if (languageModes.includes(mode) && userLanguage && messages.length > 0) {
      const lastIdx = messages.findLastIndex((m: any) => m.role === "user");
      if (lastIdx >= 0) {
        finalMessages = [...messages];
        const langMap: Record<string, string> = {
          ar: 'Arabic', fr: 'French', es: 'Spanish', de: 'German',
          ja: 'Japanese', ko: 'Korean', zh: 'Chinese', pt: 'Portuguese',
          ru: 'Russian', tr: 'Turkish', hi: 'Hindi', it: 'Italian',
          nl: 'Dutch', pl: 'Polish', en: 'English',
        };
        const langName = langMap[userLanguage] || userLanguage;
        finalMessages[lastIdx] = {
          ...finalMessages[lastIdx],
          content: appendTextToMessageContent(
            finalMessages[lastIdx].content,
            `\n\nCRITICAL: You MUST reply ENTIRELY in ${langName}. Every word of your response must be in ${langName}. USER_LANGUAGE=${userLanguage}`,
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
