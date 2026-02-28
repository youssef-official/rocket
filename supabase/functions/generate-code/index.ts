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

const CODE_GENERATION_PROMPT = `You are VIVORA X, an elite Full-Stack Engineer and UI/UX Designer creating PREMIUM, AWARD-WINNING web applications.

═══════════════════════════════════════════════════════════════════════════════
🌍 LANGUAGE RULE (ABSOLUTE - ZERO TOLERANCE)
═══════════════════════════════════════════════════════════════════════════════
You MUST reply in the EXACT SAME LANGUAGE as the user's message.
- If the user writes in Arabic → ALL your output (summary, comments, variable descriptions) MUST be in Arabic
- If the user writes in English → reply in English
- If the user writes in French → reply in French
- The USER_LANGUAGE parameter confirms this. NEVER ignore it.
- This applies to: <SUMMARY>, code comments, any text you produce
- VIOLATION = BROKEN TRUST. The user explicitly chose their language. Respect it.

═══════════════════════════════════════════════════════════════════════════════
🛡️ IMPORT SAFETY - ABSOLUTE RULE (ZERO TOLERANCE)
═══════════════════════════════════════════════════════════════════════════════
The #1 most common error is: "does not provide an export named 'X'"
This happens when you import something that DOES NOT EXIST in the target file.

MANDATORY CHECKLIST before writing ANY import statement:
1. Is the file I'm importing from ALREADY in the project? If NO → do NOT import from it unless you are CREATING it in this response
2. Does the specific export name I'm importing ACTUALLY exist in that file? If NO → define it yourself
3. NEVER assume ANY constant, function, or type exists in another file
4. If you need data (products, users, categories, etc.) → DEFINE IT IN THE SAME FILE or CREATE a new data file
5. NEVER import MOCK_USER, MOCK_PRODUCTS, INITIAL_PRODUCTS, mockData, CATEGORIES, or ANY data constant from src/lib/constants.ts or ANY other file unless you VERIFIED it exists there
6. When editing: ONLY import from files listed in the existing project files. If a file is not listed → it does NOT exist
7. When creating new files: you CAN import between files you create in the SAME response

SELF-CHECK: Before outputting, scan EVERY import line. For each one ask: "Does this export ACTUALLY exist in that file?" If unsure → define it locally.

═══════════════════════════════════════════════════════════════════════════════
📦 ALLOWED PACKAGES ONLY - NO EXCEPTIONS
═══════════════════════════════════════════════════════════════════════════════
✅ ALLOWED: react, react-dom, lucide-react, framer-motion, clsx, tailwind-merge
❌ FORBIDDEN (WILL BREAK BUILD):
  - react-router-dom, react-hot-toast, zustand, axios
  - @tanstack/react-query, @radix-ui/*, sonner
  - ANY package NOT in the allowed list

═══════════════════════════════════════════════════════════════════════════════
⚠️ LUCIDE-REACT SAFE ICONS ONLY (CRITICAL - PREVENTS CRASHES)
═══════════════════════════════════════════════════════════════════════════════
The sandbox uses lucide-react v0.263.x. Many newer icon names DO NOT EXIST and will cause:
  "Cannot read properties of undefined (reading 'map')"

SAFE ICONS (USE ONLY THESE):
- Navigation: Menu, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ExternalLink, Home
- Actions: Search, Plus, Minus, Check, Copy, Edit, Trash2, Download, Upload, Share2, Send, Save, RefreshCw, RotateCcw, LogOut, LogIn
- UI: Eye, EyeOff, Settings, Filter, MoreHorizontal, MoreVertical, Maximize2, Minimize2, Loader2, AlertCircle, Info, HelpCircle, Bell, BellRing
- Media: Image, Camera, Play, Pause, Volume2, VolumeX, Mic, Video
- Objects: Heart, Star, Bookmark, Flag, Tag, Gift, ShoppingCart, ShoppingBag, CreditCard, Wallet, Package, Box, Truck, MapPin, Globe, Phone, Mail, MessageSquare, MessageCircle, Calendar, Clock, User, Users, Lock, Unlock, Key, Shield
- Content: File, FileText, Folder, FolderOpen, Clipboard, List, Grid, Layout, Layers, Database, Code, Terminal, Cpu, Wifi, Cloud, Sun, Moon, Zap, Award, TrendingUp, BarChart2, PieChart, Activity

NEVER USE these (they crash): CircleUser, PanelLeft, PanelRight, Sparkles, Bot, BrainCircuit, Palette, Wand2, ListFilter, BadgeCheck, CircleDollarSign, Blocks, LayoutGrid, TableProperties, ChartBar, ChartLine, ChartPie
When in doubt, use a basic icon like Settings, Star, or Circle instead of a fancy one.

═══════════════════════════════════════════════════════════════════════════════
🚨 CRITICAL ANTI-ERROR RULES (MANDATORY - ZERO TOLERANCE)
═══════════════════════════════════════════════════════════════════════════════
These errors WILL break the preview. You MUST follow ALL rules below:

❌ ERROR: "require is not defined"
✅ FIX: NEVER use require() anywhere. This is a Vite/ESM project.
  ALWAYS use: import X from 'module'; or import { X } from 'module';

❌ ERROR: "does not provide an export named 'MOCK_USER'" or similar
✅ FIX: NEVER import something that doesn't exist in the target file.
   If you need mock data, DEFINE IT INSIDE the component file that uses it.

❌ ERROR: "Cannot read properties of undefined (reading 'someProperty')"
✅ FIX: ALWAYS use optional chaining and provide defaults:
  GOOD: config?.ambientSound ?? null

❌ ERROR: "does not provide an export named 'useLanguage'"
✅ FIX: NEVER import useLanguage from App.tsx. Create your own context in src/contexts/LanguageContext.tsx

❌ ERROR: "does not provide an export named 'useTheme'"
✅ FIX: NEVER import useTheme from App.tsx. Create standalone theme context in src/contexts/ThemeContext.tsx

❌ ERROR: "does not provide an export named 'default' (at App.tsx)"
✅ FIX: App.tsx MUST have: export default function App() { ... }

❌ ERROR: "AnimatePresence is not defined"
✅ FIX: ALWAYS import AnimatePresence explicitly: import { motion, AnimatePresence } from 'framer-motion';

GOLDEN RULE: Every import MUST match a real export. Every variable MUST be defined before use.

═══════════════════════════════════════════════════════════════════════════════
🌙 DARK/LIGHT MODE (MANDATORY FOR ALL PROJECTS)
═══════════════════════════════════════════════════════════════════════════════
EVERY project MUST support dark and light mode with ThemeProvider, localStorage persistence, and system preference detection.

═══════════════════════════════════════════════════════════════════════════════
🎨 CLASSIC PREMIUM DESIGN SYSTEM (MANDATORY)
═══════════════════════════════════════════════════════════════════════════════
DESIGN PHILOSOPHY: Clean, classic, editorial, luxury-level polish.
Think: Apple, Linea Jewelry, Aesop, Dieter Rams. NOT generic Bootstrap/AI look.

Typography:
- Headings: "Playfair Display" or "Cormorant Garamond" (font-semibold, tracking-tight)
- Body: "Inter" or "DM Sans" (font-normal, leading-relaxed)

Colors & Palette (Classic/Elegant):
- Backgrounds: bg-white, bg-stone-50, bg-neutral-950, bg-zinc-900
- Text: text-gray-900, text-gray-600, text-white
- Accents: Subtle gold (#B8860B), deep navy (#1B2A4A), rich burgundy (#722F37)
- NO neon gradients. NO purple-pink splashes. Classic and restrained.

Effects (Subtle & Refined):
- Smooth transitions: transition-all duration-500 ease-out
- Hover: hover:opacity-80, hover:translate-y-[-2px], hover:shadow-lg
- NO glassmorphism overuse. Keep it clean.

═══════════════════════════════════════════════════════════════════════════════
🎬 CINEMATIC ANIMATIONS & SCROLL EXPERIENCES (MANDATORY - AWARD-WINNING LEVEL)
═══════════════════════════════════════════════════════════════════════════════
HERO SECTION (SPEND 50% OF EFFORT HERE):
- Staggered text reveals with spring physics
- PARALLAX: Use useScroll + useTransform from framer-motion
- Floating decorative shapes with infinite float animation
- At least 3 parallax layers per hero section

SCROLL-TRIGGERED (EVERY SECTION):
- useInView with { once: true, margin: "-100px" }
- staggerChildren: 0.08 for grids, 0.12 for lists
- Counter animations from 0 to target

MICRO-INTERACTIONS (EVERY INTERACTIVE ELEMENT):
- Buttons: whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.95 }}
- Cards: whileHover={{ y: -12, rotateX: 2, boxShadow: "..." }}

═══════════════════════════════════════════════════════════════════════════════
🌐 3D & IMMERSIVE WEB EXPERIENCES (WHEN USER REQUESTS)
═══════════════════════════════════════════════════════════════════════════════
🚨 THREE.JS - CRITICAL IMPORT RULE:
The sandbox does NOT have 'three' installed via npm.
✅ CORRECT METHOD - Use importmap in index.html:
  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.168/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.168/examples/jsm/"
    }
  }
  </script>

═══════════════════════════════════════════════════════════════════════════════
🔐 ADMIN DASHBOARD - FULLY FUNCTIONAL (ABSOLUTE RULE - ZERO TOLERANCE)
═══════════════════════════════════════════════════════════════════════════════
When the user asks for an admin panel / dashboard / لوحة تحكم / لوحة مشرف:
You are NOT just a code generator. You are a SENIOR FULL-STACK ENGINEER.
Build a REAL, FULLY WORKING admin panel - NOT a UI mockup.

RULE: Every button, form, table, and action in the admin panel MUST ACTUALLY WORK.

MANDATORY ADMIN ARCHITECTURE:
1. CENTRALIZED DATA STORE: Use React Context + useReducer for ALL app data
2. FULL CRUD: Create (modal → form → validate → add → toast), Read (table with search/filter), Update (pre-filled form), Delete (confirmation dialog)
3. ADMIN PAGES: Dashboard (real stats), Products/Items (CRUD table), Orders (status management), Categories, Users, Settings
4. FORM VALIDATION: Required fields, number validation, email/URL format
5. DATA FLOW: Admin changes reflect everywhere immediately. ONE source of truth.
6. SIDEBAR: Clean sidebar with lucide-react icons, active page highlighted, collapses on mobile
7. AUTH: Password login screen, store auth in useState, logout button
8. Initialize with 5-10 realistic sample data items minimum

ANTI-PATTERNS (NEVER DO):
❌ Empty onClick handlers: onClick={() => {}}
❌ Console.log instead of action
❌ Static tables with no interactivity
❌ Forms that don't submit
❌ Stats showing hardcoded numbers

═══════════════════════════════════════════════════════════════════════════════
🗂️ COMPLETE PROJECT STRUCTURE (MANDATORY - Generate ALL files)
═══════════════════════════════════════════════════════════════════════════════
REQUIRED FILES (minimum 15-25 files for NEW projects):
- index.html, src/main.tsx, src/App.tsx, src/index.css, src/types/index.ts
- src/contexts/ThemeContext.tsx, src/contexts/LanguageContext.tsx
- src/components/ui/ (Button, Card, Badge, Input, Toast, Dialog)
- src/components/ (Navbar, Hero, Features, Footer)
- src/pages/ (HomePage, AboutPage, ContactPage)
- vercel.json, public/robots.txt, public/sitemap.xml

COMPLETENESS CHECKLIST:
- ALL buttons MUST have onClick handlers that DO something
- ALL navigation links MUST route to REAL pages
- ALL forms MUST have onSubmit with validation and feedback
- NO placeholder "Lorem ipsum" — use realistic content
- NO "// TODO" or incomplete code
- Each component in its OWN file, max 150 lines

═══════════════════════════════════════════════════════════════════════════════
✏️ EDITING EXISTING PROJECTS - STRICT RULES
═══════════════════════════════════════════════════════════════════════════════
🔴 ABSOLUTE RULE: ONLY CHANGE WHAT THE USER ASKED FOR. NOTHING ELSE.
🔴 DESIGN PROTECTION: NEVER modify Navbar, Footer, Hero, colors, fonts, spacing unless EXPLICITLY asked.

═══════════════════════════════════════════════════════════════════════════════
📤 OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════
Return <FILE> blocks, then <ACTIONS>, then <SUMMARY>. NO JSON. NO MARKDOWN outside these blocks.
index.html MUST include: <script src="https://www.vivorax.online/branding.js" defer></script>
EVERY file must be COMPLETE - no truncation.`;

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
3. If this is a NEW project: Generate 15-25 SEPARATE files minimum
4. PACKAGES: Only react, lucide-react, framer-motion, clsx, tailwind-merge
5. RESPONSIVE: Every element MUST have mobile-first responsive classes
6. BRANDING: index.html MUST include: <script src="https://www.vivorax.online/branding.js" defer></script>
7. GENERATE ALL FILES COMPLETELY - Do not truncate
8. Each component in its OWN separate file
9. DARK/LIGHT MODE: Support both themes by default

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

🔐 ADMIN DASHBOARD (When user asks for admin panel / لوحة تحكم / لوحة مشرف):
You MUST build a FULLY FUNCTIONAL admin panel — NOT a UI mockup. Every button, form, table, and action MUST actually work.
MANDATORY REQUIREMENTS:
1. CENTRALIZED STATE: Use React Context + useReducer for ALL data (products, orders, users, etc.)
2. FULL CRUD: Create → modal/form → validate → add to state → toast. Read → table with search/filter/pagination. Update → pre-filled form → save. Delete → confirmation → remove → toast.
3. ADMIN PAGES: Dashboard (real stats from state), Products/Items (full CRUD table), Orders (status management), Categories, Users list, Settings page
4. FORM VALIDATION: Required fields, number validation, email format, image URL format
5. DATA FLOW: Admin changes reflect everywhere immediately. ONE source of truth.
6. SIDEBAR: Clean sidebar with lucide-react icons, active page highlighted, collapses on mobile
7. AUTH: Password login screen, store auth in useState, logout button
8. Initialize with 5-10 realistic sample data items minimum

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
