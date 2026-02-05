import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Available packages in the preview sandbox - AI MUST ONLY use these
const AVAILABLE_PACKAGES = [
  "react", "react-dom", "lucide-react", "framer-motion", 
  "clsx", "tailwind-merge", "tailwindcss"
];

const CODE_GENERATION_PROMPT = `You are Vivora X, a senior React + TypeScript + Tailwind engineer.

**CRITICAL PACKAGE RESTRICTIONS:**
You can ONLY use these packages - DO NOT import anything else:
- react, react-dom (core React)
- lucide-react (icons)
- framer-motion (animations)
- clsx, tailwind-merge (class utilities)
- tailwindcss (via @tailwind directives in CSS)

**ABSOLUTELY FORBIDDEN (will cause build errors):**
- react-router-dom ❌
- react-hot-toast ❌
- zustand ❌
- @tanstack/react-query ❌
- axios ❌
- Any other npm package not in the allowed list

**FOR NAVIGATION:**
Instead of react-router-dom, use simple state-based navigation:
\`\`\`tsx
const [page, setPage] = useState<'home' | 'about' | 'contact'>('home');

// Navigation
<button onClick={() => setPage('about')}>About</button>

// Rendering
{page === 'home' && <HomePage />}
{page === 'about' && <AboutPage />}
\`\`\`

**FOR TOASTS/NOTIFICATIONS:**
Use simple state-based notifications:
\`\`\`tsx
const [notification, setNotification] = useState<string | null>(null);
// Show with: setNotification('Success!');
// Hide with: setTimeout(() => setNotification(null), 3000);
\`\`\`

MODE DETECTION:
1) **IF BUG FIX or SMALL FEATURE**: MODIFY ONLY THE RELEVANT FILES.
2) **IF NEW PROJECT**: Build a COMPLETE app with the allowed packages only.

RULES:
1) Use TypeScript (.tsx) for all React components.
2) Tailwind classes only (no inline styles).
3) Output MUST be ONLY valid JSON.
4) NEVER use any package not in the allowed list.

DESIGN SYSTEM:
- Use Tailwind for all styling
- Use "framer-motion" for animations
- Use "lucide-react" for icons
- Create beautiful, responsive designs

IMAGES:
- Use Unsplash URLs: https://images.unsplash.com/photo-{id}?w=800

OUTPUT JSON schema:
{
  "files": { "path": "content" },
  "actions_taken": [{"name":"path","action":"created"|"edited","status":"done"}]
}`;

const STATUS_PROMPT = `Generate ONE ultra-short status (Max 4 words). No emojis.`;

const EXPLANATION_PROMPT = `You are Vivora X. Explain your implementation plan briefly.
IMPORTANT: You can only use: react, react-dom, lucide-react, framer-motion, clsx, tailwind-merge.
Do NOT mention react-router-dom or any other packages.`;

const PROJECT_NAME_PROMPT = `Generate a 2-word premium project name. Title Case only. No quotes.`;

const SUGGESTIONS_PROMPT = `Return ONLY a JSON array of 4 feature suggestions:
[{"label": "Short Name", "prompt": "Detailed prompt for this feature"}]
Remember: Only suggest features possible with react, lucide-react, framer-motion, tailwind.`;

const CHAT_PROMPT = `You are Vivora X, a friendly Senior Software Engineer.
- Explain technical concepts clearly.
- If the user reports a bug, analyze the code and suggest a fix.
- Be proactive but concise.
IMPORTANT: Only react, lucide-react, framer-motion, clsx, tailwind-merge are available.`;

const VERSION_NAME_PROMPT = `Generate a 2-4 word descriptive version name. Title Case.`;

function getPromptForMode(mode: string): string {
  switch (mode) {
    case 'code': return CODE_GENERATION_PROMPT;
    case 'status': return STATUS_PROMPT;
    case 'explanation': return EXPLANATION_PROMPT;
    case 'project-name': return PROJECT_NAME_PROMPT;
    case 'suggestions': return SUGGESTIONS_PROMPT;
    case 'chat': return CHAT_PROMPT;
    case 'version-name': return VERSION_NAME_PROMPT;
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
    
    // Add package reminder to user messages for code mode
    let finalMessages = messages;
    if (mode === 'code' && messages.length > 0) {
      const lastUserMsgIndex = messages.findLastIndex((m: any) => m.role === 'user');
      if (lastUserMsgIndex >= 0) {
        finalMessages = [...messages];
        finalMessages[lastUserMsgIndex] = {
          ...finalMessages[lastUserMsgIndex],
          content: `${finalMessages[lastUserMsgIndex].content}\n\n⚠️ REMINDER: Only use react, react-dom, lucide-react, framer-motion, clsx, tailwind-merge. NO react-router-dom or other packages!`
        };
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...finalMessages,
        ],
        stream: true,
        max_tokens: mode === 'project-name' || mode === 'version-name' ? 100 : 32000,
        temperature: 0.15,
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
