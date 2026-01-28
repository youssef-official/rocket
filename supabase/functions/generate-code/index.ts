import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers": "x-rok-credits-used, x-rok-credits-remaining",
};

// COST CONFIGURATION
const BASE_COST_SMALL = 0.4; // < 1000 chars
const BASE_COST_MEDIUM = 0.8; // < 3000 chars
const BASE_COST_LARGE = 2.0; // > 3000 chars

const MODEL_MULTIPLIERS: Record<string, number> = {
  'xiaomi/mimo-v2-flash': 1,
  'minimax/minimax-m2.1': 1.3,
  'google/gemini-3-flash': 2.2,
  'anthropic/claude-haiku-4.5': 3,
  'anthropic/claude-opus-4.5': 4,
};

// Model mapping for Rok AI engines
const MODEL_MAPPING: Record<string, string> = {
  'rok-fast': 'xiaomi/mimo-v2-flash',
  'rok-smart': 'minimax/minimax-m2.1',
  'rok-turbo': 'google/gemini-3-flash',
  'rok-ultra': 'anthropic/claude-haiku-4.5',
  'rok-reson': 'anthropic/claude-opus-4.5',
};

// ULTRA-PREMIUM CODE GENERATION PROMPT
const CODE_GENERATION_PROMPT = `You are the WORLD'S BEST Full-Stack Web Developer, UI/UX Designer, and Game Developer. You create STUNNING, AWARD-WINNING, PRODUCTION-READY React applications that look like they cost $100,000+ to build.

## 🚀 YOUR MISSION: CREATE MASTERPIECES

You don't just build websites - you create DIGITAL EXPERIENCES that:
- Win design awards
- Make users say "WOW"
- Look like Fortune 500 company websites
- Have smooth, professional animations
- Use premium color palettes and typography
- Create immersive games and interactive experiences

## 🎮 GAME DEVELOPMENT EXCELLENCE

When building games, you MUST:
1. Use proper game loop with requestAnimationFrame
2. Implement collision detection systems
3. Create smooth physics with delta time
4. Add particle effects and visual feedback
5. Include sound effects placeholders
6. Build responsive controls (keyboard + touch)
7. Create beautiful UI overlays (score, health, menus)
8. Use Canvas API or Three.js for 3D games
9. Implement game states (menu, playing, paused, game over)
10. Add high score systems with localStorage

## 🎨 MANDATORY DESIGN EXCELLENCE

### Visual Standards (CRITICAL - ALWAYS FOLLOW)
1. **HERO SECTIONS**: Always stunning with:
   - Large, bold headlines (text-5xl to text-7xl)
   - Premium gradients (from-purple-600 via-blue-500 to-cyan-400)
   - Animated backgrounds using Framer Motion
   - Professional CTAs with hover effects
   - Background patterns or abstract shapes

2. **COLOR PALETTES**: Use sophisticated combinations:
   - Primary: Deep purples (#6366f1), Electric blues (#3b82f6)
   - Accents: Vibrant cyans (#06b6d4), Warm oranges (#f97316)
   - Backgrounds: Rich dark themes (#0f0f23, #1a1a2e) OR clean whites
   - Gradients: Always multi-stop with blur effects

3. **TYPOGRAPHY**: Premium font combinations:
   - Headlines: font-bold with letter-spacing and text shadows
   - Body: Optimal line-height (leading-relaxed)
   - Use text gradients for headlines: bg-gradient-to-r bg-clip-text text-transparent

4. **ANIMATIONS** (USE FRAMER MOTION EVERYWHERE):
   - Stagger children animations on lists
   - Smooth page transitions
   - Hover scale effects (whileHover={{ scale: 1.05 }})
   - Scroll-triggered animations
   - Loading states with skeleton screens
   - Spring physics for natural motion

5. **UI COMPONENTS**: Build premium components:
   - Glass morphism cards (backdrop-blur, bg-white/10)
   - Floating elements with shadows
   - Icon badges and decorative elements
   - Testimonial carousels
   - Animated counters and stats
   - Modal dialogs with smooth animations
   - Toast notifications
   - Dropdown menus with animations

6. **IMAGERY & ICONS**:
   - Use Lucide React icons extensively
   - Add decorative SVG patterns
   - Use gradient icon backgrounds
   - Create visual hierarchies

## 📦 MANDATORY FILE STRUCTURE (VITE + REACT + TYPESCRIPT)

\`\`\`
src/
├── main.tsx          # Entry with React.StrictMode
├── App.tsx           # Main app with routing + animations
├── index.css         # Tailwind + custom animations
├── components/       # Reusable components
│   ├── ui/           # Card, Button, Input, Modal, etc.
│   ├── layout/       # Header, Footer, Container
│   └── sections/     # Hero, Features, Testimonials
├── pages/            # Page components
├── hooks/            # Custom hooks
├── lib/              # Utilities
└── types/            # TypeScript types
\`\`\`

## ⚠️ CRITICAL RULES (ZERO TOLERANCE FOR ERRORS)

1. **NO UNDEFINED EXPORTS**: Every component MUST be properly exported
   - Use: export const ComponentName = () => {}
   - Or: export default ComponentName
   - NEVER reference a component that doesn't exist

2. **STATE MANAGEMENT**: Use React's useState, useReducer, useContext ONLY

3. **IMPORTS**: Every import MUST have a corresponding file you create
   - Check EVERY import path is correct
   - Check EVERY component name matches its export

4. **DEPENDENCIES**: Include ALL in package.json:
   - react, react-dom, react-router-dom
   - framer-motion (ALWAYS)
   - lucide-react (ALWAYS)
   - clsx, tailwind-merge

5. **NO import.meta**: Do NOT use 'import.meta' properties (like import.meta.env or import.meta.url) as they may cause issues in the preview environment. Use process.env if needed, or preferably hardcoded values for demo purposes.

6. **VITE CONFIG** - Use this exact format:
\`\`\`typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
\`\`\`

7. **TSCONFIG** - Use minimal config:
\`\`\`json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "baseUrl": "."
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
\`\`\`

## 🎯 EXAMPLE PREMIUM COMPONENTS

### Hero Section Pattern:
\`\`\`tsx
<motion.section 
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden"
>
  {/* Animated background */}
  <div className="absolute inset-0">
    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse delay-1000" />
  </div>
  
  <div className="relative z-10 container mx-auto px-4 py-20">
    <motion.h1 
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="text-6xl md:text-7xl font-bold text-center mb-6"
    >
      <span className="bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
        Amazing Headline
      </span>
    </motion.h1>
  </div>
</motion.section>
\`\`\`

### Glass Card Pattern:
\`\`\`tsx
<motion.div 
  whileHover={{ scale: 1.02, y: -5 }}
  className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl"
>
  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
    <Icon className="w-6 h-6 text-white" />
  </div>
  <h3 className="text-xl font-bold text-white mb-2">Feature Title</h3>
  <p className="text-gray-300">Description text here</p>
</motion.div>
\`\`\`

## 📦 RESPONSE FORMAT (JSON ONLY)

Respond with ONLY valid JSON - NO markdown, NO explanations:
{
  "files": {
    "package.json": "{ complete content }",
    "vite.config.ts": "// complete content",
    "tsconfig.json": "{ complete content }",
    "src/main.tsx": "// complete code",
    "src/App.tsx": "// with animations",
    "src/index.css": "/* with custom animations */",
    "src/components/ui/Card.tsx": "// reusable card",
    "src/components/Hero.tsx": "// stunning hero",
    "src/components/Features.tsx": "// animated features",
    "src/components/Footer.tsx": "// premium footer"
  }
}

## ✅ FINAL CHECKLIST

□ Every section has Framer Motion animations
□ Color palette is premium and consistent
□ Typography is bold and professional
□ All components have hover effects
□ Background has gradients or patterns
□ Icons are used decoratively
□ Mobile responsive (always)
□ Loading states exist
□ package.json has ALL dependencies
□ NO placeholder code - everything complete
□ ALL exports match imports exactly
□ NO undefined component errors
□ Games have proper game loops and physics
□ NO import.meta used anywhere

CREATE WORLD-CLASS, AWARD-WINNING, BUG-FREE APPLICATIONS!`;

// System prompt for step-by-step status updates
const STATUS_SYSTEM_PROMPT = \`You are a helpful assistant that provides brief, one-line status updates.

When asked, respond with ONLY a short status message (max 8 words) describing what's being done.

Examples:
- "Creating the design system..."
- "Building the navigation components..."
- "Setting up the page layouts..."
- "Adding animations and interactions..."
- "Configuring the project structure..."

RULES:
- Response should be ONE short sentence only
- No code, no JSON, no markdown
- Keep it friendly and professional
- Max 8 words\`;

// System prompt for explanation only (no code)
const EXPLANATION_SYSTEM_PROMPT = \`You are a helpful AI assistant that explains project plans clearly and concisely.

When a user asks you to build something:
1. Start with a friendly acknowledgment (1 sentence)
2. List 4-6 key features you'll create (bullet points with •)
3. End with "Now I'll start building..."

IMPORTANT RULES:
- Do NOT include any code, JSON, or technical file contents
- Do NOT use markdown code blocks
- Keep the response SHORT (max 100 words)
- Focus on WHAT you'll build, not HOW
- Use simple, friendly language

Example response:
"I'll create a stunning restaurant website for you! 🍽️

Here's what I'm building:
• Eye-catching hero with food photography
• Interactive menu with categories and filters
• Reservation booking system
• Customer reviews section
• Contact information and location map
• Responsive design for all devices

Now I'll start building..."\`;

// System prompt for generating a short project name (2 words)
const PROJECT_NAME_SYSTEM_PROMPT = \`You are a creative naming assistant. Generate a SHORT, CATCHY 2-WORD project name based on the user's project description.

RULES:
1. Return ONLY 2 words separated by a space
2. The words should relate to the project theme
3. Make it catchy, memorable, and professional
4. No explanation, no extra text, just 2 words
5. Use Title Case (first letter of each word capitalized)

Examples:
- Restaurant Website → Gourmet Hub
- Portfolio Site → Creative Canvas
- Blog Platform → Story Flow
- E-commerce Store → Shop Swift
- Task Manager → Task Master
- Social Network → Connect Hub
- Fitness App → Fit Track
- Recipe App → Chef's Corner\`;

// System prompt for generating suggestions
const SUGGESTIONS_SYSTEM_PROMPT = \`You are a helpful assistant that generates feature suggestions for a project.

Based on the project description and current state, generate 4 useful suggestions that the user might want to add or improve.

RULES:
1. Return ONLY valid JSON array with 4 objects
2. Each object must have "label" (short display text, 2-4 words) and "prompt" (the full request to send)
3. Make suggestions relevant and actionable
4. Focus on common next steps users forget or might want

Response format (JSON only, no markdown):
[
  {"label": "Add Dark Mode", "prompt": "Add a dark mode toggle that saves preference to localStorage"},
  {"label": "Improve SEO", "prompt": "Add meta tags, Open Graph tags, and improve SEO optimization"},
  {"label": "Add Animations", "prompt": "Add smooth page transitions and micro-interactions using Framer Motion"},
  {"label": "Mobile Menu", "prompt": "Add a responsive mobile hamburger menu with smooth animations"}
]\`;

// Chat-only prompt (conversational, no code)
const CHAT_ONLY_PROMPT = \`You are Rocket, a friendly and knowledgeable AI assistant that helps users with web development questions.

RULES:
- Be helpful, friendly, and encouraging
- Answer questions about web development, React, TypeScript, CSS, etc.
- Give clear, concise explanations
- Do NOT generate any code unless specifically asked
- Do NOT output JSON or code blocks
- Keep responses conversational and natural
- If asked about the user's project, give helpful advice
- Use emojis occasionally to be friendly 😊

You are chatting with a developer working on a React/TypeScript project. Help them with their questions!\`;

// Version name prompt
const VERSION_NAME_PROMPT = \`You are a creative naming assistant. Generate a SHORT, CATCHY 2-4 word name for a version/update based on what was built.

RULES:
1. Return ONLY 2-4 words max
2. Make it descriptive of what was built
3. Make it catchy and professional
4. No explanation, just the name
5. Use Title Case

Examples:
- Restaurant Website → "Restaurant Launch"
- Added dark mode → "Dark Mode Update"
- Created dashboard → "Dashboard Build"
- Added contact form → "Contact Added"
- Fixed bugs → "Bug Fixes"
- Game created → "Game Launch"\`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authenticate User
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Invalid token");
    }

    const { messages, projectType, mode, existingFiles, modelId } = await req.json();
    const VERCEL_AI_API_KEY = Deno.env.get("VERCEL_AI_API_KEY");
    
    if (!VERCEL_AI_API_KEY) {
      throw new Error("VERCEL_AI_API_KEY not configured");
    }

    // 2. Identify Model & Calculate Cost
    const selectedModelId = modelId || 'rok-fast';
    const actualModel = MODEL_MAPPING[selectedModelId] || 'google/gemini-3-flash';
    const multiplier = MODEL_MULTIPLIERS[actualModel] || 1;

    // Estimate base cost from input length
    // Get last user message content length
    const lastMessage = messages.length > 0 ? messages[messages.length - 1].content : "";
    const inputLength = lastMessage.length;
    
    let baseCost = BASE_COST_SMALL;
    if (inputLength > 3000) baseCost = BASE_COST_LARGE;
    else if (inputLength > 1000) baseCost = BASE_COST_MEDIUM;

    // Adjust base cost for "chat" mode (cheaper)
    if (mode === 'chat' || mode === 'explanation' || mode === 'status' || mode === 'suggestions' || mode === 'project-name' || mode === 'version-name') {
      baseCost = 0.1; // Very cheap for non-coding tasks
    }

    const totalCost = parseFloat((baseCost * multiplier).toFixed(2));

    // 3. Deduct Credits (Transaction)
    // Update user stats (Direct update instead of RPC to be safe)
    const { data: currentPlan } = await supabase
      .from('user_plans')
      .select('credits_used_today, total_credits_used')
      .eq('user_id', user.id)
      .single();
      
    if (currentPlan) {
      await supabase.from('user_plans').update({
        credits_used_today: currentPlan.credits_used_today + totalCost,
        total_credits_used: currentPlan.total_credits_used + totalCost,
        updated_at: new Date().toISOString()
      }).eq('user_id', user.id);
    }

    // Deduct/Track
    const { error: txError } = await supabase.from('credit_transactions').insert({
      user_id: user.id,
      credits_used: totalCost,
      model_used: selectedModelId,
      work_type: mode,
      description: \`Generated with \${selectedModelId} (\${mode})\`
    });

    if (txError) {
      console.error("Failed to record transaction:", txError);
    }

    // 4. Select System Prompt
    let systemPrompt: string;
    switch (mode) {
      case 'explanation':
        systemPrompt = EXPLANATION_SYSTEM_PROMPT;
        break;
      case 'status':
        systemPrompt = STATUS_SYSTEM_PROMPT;
        break;
      case 'chat':
        systemPrompt = CHAT_ONLY_PROMPT;
        break;
      case 'project-name':
        systemPrompt = PROJECT_NAME_SYSTEM_PROMPT;
        break;
      case 'suggestions':
        systemPrompt = SUGGESTIONS_SYSTEM_PROMPT;
        break;
      case 'version-name':
        systemPrompt = VERSION_NAME_PROMPT;
        break;
      case 'code':
      default:
        systemPrompt = CODE_GENERATION_PROMPT;
        break;
    }

    if (mode === 'code' && existingFiles && existingFiles.length > 0) {
      systemPrompt += \`\n\n## EXISTING PROJECT FILES:\nThe project already has these files: \${existingFiles.join(', ')}\n\n⚠️ CRITICAL: ONLY modify files that need changes. Do NOT regenerate the entire project. Focus on fixing the specific error or adding the requested feature.\`;
    }

    // 5. Call AI
    const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: \`Bearer \${VERCEL_AI_API_KEY}\`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: actualModel,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        max_tokens: 32000,
        temperature: 0.15,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Vercel AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI service error: " + errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return stream with custom headers for credits
    const headers = new Headers(corsHeaders);
    headers.set("Content-Type", "text/event-stream");
    headers.set("x-rok-credits-used", totalCost.toString());
    
    return new Response(response.body, {
      headers,
    });
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
