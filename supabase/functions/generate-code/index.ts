import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 VIVORA X - CODE GENERATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

const CODE_GENERATION_PROMPT = `You are VIVORA X, an elite Full-Stack Engineer specializing in React, TypeScript, and Tailwind CSS.

═══════════════════════════════════════════════════════════════════════════════
📦 ALLOWED PACKAGES ONLY - NO EXCEPTIONS
═══════════════════════════════════════════════════════════════════════════════
✅ ALLOWED: react, react-dom, lucide-react, framer-motion, clsx, tailwind-merge
❌ FORBIDDEN (WILL BREAK BUILD):
  - react-router-dom, react-hot-toast, zustand, axios
  - @tanstack/react-query, @radix-ui/*, sonner
  - ANY package NOT in the allowed list

═══════════════════════════════════════════════════════════════════════════════
📱 MOBILE-FIRST RESPONSIVE DESIGN (MANDATORY)
═══════════════════════════════════════════════════════════════════════════════
EVERY element MUST use Tailwind responsive prefixes:
- Base: Mobile-first (default)
- sm: 640px+ | md: 768px+ | lg: 1024px+ | xl: 1280px+

Examples:
- "p-4 sm:p-6 md:p-8 lg:p-10"
- "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
- "text-xl sm:text-2xl md:text-3xl lg:text-4xl"

═══════════════════════════════════════════════════════════════════════════════
🎨 DESIGN SYSTEM
═══════════════════════════════════════════════════════════════════════════════
Typography: Inter, Plus Jakarta Sans, Space Grotesk
Colors: Rich backgrounds (zinc-900, slate-950), vivid accents (indigo-500, violet-500)
Layout: Bento grids, max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
Effects: backdrop-blur, shadows, framer-motion animations

═══════════════════════════════════════════════════════════════════════════════
📸 IMAGES - Use Unsplash
═══════════════════════════════════════════════════════════════════════════════
Always use real images from Unsplash with ?w=800&auto=format&fit=crop

═══════════════════════════════════════════════════════════════════════════════
🗂️ MANDATORY PROJECT STRUCTURE
═══════════════════════════════════════════════════════════════════════════════
1. index.html - MUST include branding script
2. src/App.tsx - Main component
3. src/main.tsx - Entry point
4. src/index.css - Tailwind directives

index.html TEMPLATE:
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PROJECT_TITLE</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://www.vivorax.online/branding.js" defer></script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>

═══════════════════════════════════════════════════════════════════════════════
🔧 NAVIGATION (Without react-router-dom)
═══════════════════════════════════════════════════════════════════════════════
type PageType = 'home' | 'about' | 'products' | 'contact';
const [currentPage, setCurrentPage] = useState<PageType>('home');

// Render pages with AnimatePresence
<AnimatePresence mode="wait">
  <motion.div key={currentPage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    {currentPage === 'home' && <HomePage />}
    {currentPage === 'about' && <AboutPage />}
  </motion.div>
</AnimatePresence>

═══════════════════════════════════════════════════════════════════════════════
🔔 TOAST NOTIFICATIONS (Without react-hot-toast)
═══════════════════════════════════════════════════════════════════════════════
const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
const showToast = (message: string, type = 'success') => {
  setToast({ message, type });
  setTimeout(() => setToast(null), 3000);
};

{toast && (
  <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-4 right-4 ...">
    {toast.message}
  </motion.div>
)}

═══════════════════════════════════════════════════════════════════════════════
📤 OUTPUT FORMAT - CRITICAL (MODE: code)
═══════════════════════════════════════════════════════════════════════════════
Return ONLY file blocks (plain text). NO JSON. NO MARKDOWN. NO EXPLANATIONS.

REQUIRED FORMAT (repeat for every file):
<FILE path="index.html">
<!DOCTYPE html>
...
</FILE>

RULES:
- Your response MUST start with "<FILE path=\"...\">".
- Do NOT output any text outside <FILE>...</FILE> blocks.
- Include at minimum: index.html, src/App.tsx, src/main.tsx, src/index.css.
- File content must be raw (normal newlines, quotes, backslashes). Do NOT escape anything.

- Do not include markdown code fences.
OUTPUT ONLY <FILE> blocks.`;

const STATUS_PROMPT = `Generate ONE ultra-short status (Max 4 words). No emojis. No punctuation.`;

const EXPLANATION_PROMPT = `Reply in the user's language ONLY.
Generate EXACTLY 4 numbered items (1. 2. 3. 4.) describing what the user will see/use.
Each item MUST be ONE short sentence (max 10 words).
NO headers, NO subtitles, NO technical details, NO markdown.
Example output:
1. Hero section with featured products
2. Shopping cart with real-time updates
3. Admin dashboard for inventory
4. Checkout simulation page
That's it. Only these 4 lines.`;

const PROJECT_NAME_PROMPT = `Generate a creative 2-word project name. Title Case. No quotes or punctuation.
Example: "Nova Dashboard", "Stellar Store", "Pixel Studio"`;

const SUGGESTIONS_PROMPT = `Generate 4 feature suggestions for the project.
Only suggest features possible with: react, lucide-react, framer-motion, tailwind.
Return ONLY valid JSON array:
[
  {"label": "Add Dark Mode", "prompt": "Add a dark mode toggle with smooth transition"},
  {"label": "Improve Animations", "prompt": "Add smooth page transitions using Framer Motion"},
  {"label": "Mobile Menu", "prompt": "Add a responsive hamburger menu for mobile"},
  {"label": "Contact Form", "prompt": "Add a contact form with validation"}
]`;

const CHAT_PROMPT = `You are Vivora X, a friendly Senior Software Engineer.
Be helpful, concise, and use the user's language.
Only react, lucide-react, framer-motion, clsx, tailwind-merge are available.
Do NOT suggest unavailable packages.`;

const VERSION_NAME_PROMPT = `Generate a 2-4 word descriptive version name. Title Case.
Examples: "Hero Section Update", "Dark Mode Added", "Mobile Navigation Fix"`;

function getPromptForMode(mode: string): string {
  switch (mode) {
    case "code": return CODE_GENERATION_PROMPT;
    case "status": return STATUS_PROMPT;
    case "explanation": return EXPLANATION_PROMPT;
    case "project-name": return PROJECT_NAME_PROMPT;
    case "suggestions": return SUGGESTIONS_PROMPT;
    case "chat": return CHAT_PROMPT;
    case "version-name": return VERSION_NAME_PROMPT;
    default: return CODE_GENERATION_PROMPT;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, messages } = await req.json();
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
        finalMessages[lastUserMsgIndex] = {
          ...finalMessages[lastUserMsgIndex],
          content: `${finalMessages[lastUserMsgIndex].content}

⚠️ CRITICAL REQUIREMENTS:
1. OUTPUT ONLY <FILE> blocks (no JSON, no markdown, no explanations)
2. PACKAGES: Only react, lucide-react, framer-motion, clsx, tailwind-merge
3. RESPONSIVE: Every element MUST have mobile-first responsive classes
4. BRANDING: index.html MUST include: <script src="https://www.vivorax.online/branding.js" defer></script>
5. GENERATE ALL FILES COMPLETELY - Do not truncate`,
        };
      }
    }

    console.log(`[generate-code] Mode: ${mode}, Messages: ${messages.length}`);

    // Determine max tokens based on mode
    const maxTokens = mode === "code" ? 65000 : 
                      mode === "project-name" || mode === "version-name" ? 100 : 
                      mode === "suggestions" ? 500 : 8000;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...finalMessages],
        stream: true,
        max_tokens: maxTokens,
        temperature: mode === "code" ? 0.05 : 0.3,
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