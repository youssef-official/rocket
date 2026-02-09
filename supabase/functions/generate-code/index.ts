import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 VIVORA X - PREMIUM CODE GENERATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

const CODE_GENERATION_PROMPT = `You are VIVORA X, an elite Full-Stack Engineer and UI/UX Designer creating PREMIUM, AWARD-WINNING web applications.

═══════════════════════════════════════════════════════════════════════════════
📦 ALLOWED PACKAGES ONLY - NO EXCEPTIONS
═══════════════════════════════════════════════════════════════════════════════
✅ ALLOWED: react, react-dom, lucide-react, framer-motion, clsx, tailwind-merge
❌ FORBIDDEN (WILL BREAK BUILD):
  - react-router-dom, react-hot-toast, zustand, axios
  - @tanstack/react-query, @radix-ui/*, sonner
  - ANY package NOT in the allowed list

═══════════════════════════════════════════════════════════════════════════════
🎨 PREMIUM DESIGN SYSTEM (MANDATORY)
═══════════════════════════════════════════════════════════════════════════════
Typography:
- Headings: "Plus Jakarta Sans" or "Space Grotesk" (font-bold, letter-tight)
- Body: "Inter" (font-normal, leading-relaxed)
- Hero text: text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black
- Subheadings: text-2xl sm:text-3xl md:text-4xl font-semibold
- Body: text-base sm:text-lg leading-relaxed

Colors & Gradients:
- Dark themes: from-zinc-950 via-slate-900 to-black
- Accent gradients: from-indigo-500 via-purple-500 to-pink-500
- Text gradients: bg-gradient-to-r bg-clip-text text-transparent
- Glass effects: bg-white/5 backdrop-blur-xl border border-white/10

Advanced Effects:
- Shadows: shadow-2xl shadow-indigo-500/20
- Hover states: hover:scale-105 hover:shadow-xl transition-all duration-300
- Animated gradients: animate-pulse, custom keyframes
- Glassmorphism: backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl

═══════════════════════════════════════════════════════════════════════════════
📱 MOBILE-FIRST RESPONSIVE (MANDATORY)
═══════════════════════════════════════════════════════════════════════════════
EVERY element MUST use responsive prefixes:
- Base: Mobile-first | sm: 640px+ | md: 768px+ | lg: 1024px+ | xl: 1280px+

═══════════════════════════════════════════════════════════════════════════════
📸 IMAGES - Use Unsplash ONLY
═══════════════════════════════════════════════════════════════════════════════
Always use: https://images.unsplash.com/photo-ID?w=800&auto=format&fit=crop

═══════════════════════════════════════════════════════════════════════════════
🗂️ COMPLETE PROJECT STRUCTURE (MANDATORY - Generate ALL files)
═══════════════════════════════════════════════════════════════════════════════
You MUST generate a COMPLETE project with SEPARATE files for each component:

REQUIRED FILES (minimum 8-15 files):
1. index.html - Main HTML with fonts and branding
2. src/main.tsx - Entry point
3. src/App.tsx - Main app with routing logic
4. src/index.css - Tailwind + custom animations

COMPONENTS (in src/components/):
5. src/components/Navbar.tsx - Navigation with mobile menu
6. src/components/Hero.tsx - Hero section with animations
7. src/components/Features.tsx - Features grid/bento
8. src/components/Footer.tsx - Footer with links

PAGES (in src/pages/):
9. src/pages/HomePage.tsx - Home page
10. src/pages/AboutPage.tsx - About page
11. src/pages/ContactPage.tsx - Contact with form

UI COMPONENTS (in src/components/ui/):
12. src/components/ui/Button.tsx - Reusable button
13. src/components/ui/Card.tsx - Reusable card
14. src/components/ui/Toast.tsx - Toast notifications

IMPORTANT:
- Each component in its OWN file
- NO component longer than 150 lines
- Use imports between files
- Every component must be PREMIUM quality

═══════════════════════════════════════════════════════════════════════════════
🧭 NAVIGATION PATTERN (Without react-router-dom)
═══════════════════════════════════════════════════════════════════════════════
// In App.tsx:
type PageType = 'home' | 'about' | 'contact' | 'services';
const [currentPage, setCurrentPage] = useState<PageType>('home');

<AnimatePresence mode="wait">
  <motion.div key={currentPage} 
    initial={{ opacity: 0, y: 20 }} 
    animate={{ opacity: 1, y: 0 }} 
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    {currentPage === 'home' && <HomePage />}
    {currentPage === 'about' && <AboutPage />}
  </motion.div>
</AnimatePresence>

═══════════════════════════════════════════════════════════════════════════════
📤 OUTPUT FORMAT - CRITICAL
═══════════════════════════════════════════════════════════════════════════════
Return ONLY <FILE> blocks. NO JSON. NO MARKDOWN. NO EXPLANATIONS.

<FILE path="index.html">
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PROJECT_TITLE</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://www.vivorax.online/branding.js" defer></script>
</head>
<body class="antialiased">
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
</FILE>

RULES:
- Response MUST start with "<FILE path="...">".
- Generate 8-15 separate files minimum.
- Each component in its own file.
- Premium, award-winning design quality.
- Smooth framer-motion animations everywhere.
- OUTPUT ONLY <FILE> blocks.`;

const EXPLANATION_PROMPT = `Reply in the user's language.
Generate 6-8 numbered items describing the project in detail.
Each item should be 1-2 sentences explaining a feature or page.
Include design choices and what makes it special.

Format:
1. [Feature name]: [Description of what it does and how it looks]
2. [Feature name]: [Description]
...

Be descriptive and exciting about the premium design elements.
Mention animations, colors, and user experience details.`;

const PROJECT_NAME_PROMPT = `Generate a creative 2-word project name. Title Case. No quotes or punctuation.
Example: "Nova Dashboard", "Stellar Store", "Pixel Studio"`;

const SUGGESTIONS_PROMPT = `Generate 4 feature suggestions as a JSON array.
Only suggest features possible with: react, lucide-react, framer-motion, tailwind.

You MUST return ONLY this exact JSON format (no markdown, no explanation):
[{"label":"Add Dark Mode","prompt":"Add a dark mode toggle with smooth transition"},{"label":"Improve Animations","prompt":"Add smooth page transitions using Framer Motion"},{"label":"Mobile Menu","prompt":"Add a responsive hamburger menu for mobile"},{"label":"Contact Form","prompt":"Add a contact form with validation"}]`;

const CHAT_PROMPT = `You are Vivora X, a friendly Senior Software Engineer.
Be helpful, concise, and use the user's language.
Only react, lucide-react, framer-motion, clsx, tailwind-merge are available.
Do NOT suggest unavailable packages.`;

const VERSION_NAME_PROMPT = `Generate a 2-4 word descriptive version name. Title Case.
Examples: "Hero Section Update", "Dark Mode Added", "Mobile Navigation Fix"`;

const STATUS_PROMPT = `Generate ONE ultra-short status (Max 4 words). No emojis. No punctuation.`;

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
2. Generate 8-15 SEPARATE files (components, pages, UI elements)
3. PREMIUM DESIGN: Glassmorphism, gradients, shadows, animations
4. PACKAGES: Only react, lucide-react, framer-motion, clsx, tailwind-merge
5. FONTS: Use Plus Jakarta Sans for headings, Inter for body
6. RESPONSIVE: Every element MUST have mobile-first responsive classes
7. BRANDING: index.html MUST include: <script src="https://www.vivorax.online/branding.js" defer></script>
8. GENERATE ALL FILES COMPLETELY - Do not truncate
9. Each component in its OWN separate file`,
        };
      }
    }

    console.log(`[generate-code] Mode: ${mode}, Messages: ${messages.length}`);

    // Determine max tokens based on mode
    const maxTokens = mode === "code" ? 100000 : 
                      mode === "project-name" || mode === "version-name" ? 100 : 
                      mode === "suggestions" ? 800 : 
                      mode === "explanation" ? 2000 : 8000;

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
        temperature: mode === "code" ? 0.1 : 0.4,
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
