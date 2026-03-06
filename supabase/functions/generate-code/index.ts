import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Max-Age": "86400",
};

// Credit calculation is now done by file count, not AI
const CREDIT_PROMPT = `Return: {"credits":1,"reason":"default","estimated_files":5,"complexity":"medium"}`;

const EXPLANATION_PROMPT = `🌍 LANGUAGE RULE (ABSOLUTE & NON-NEGOTIABLE): 
- If USER_LANGUAGE=ar → You MUST reply ENTIRELY in Arabic (العربية). Every single word must be Arabic.
- If USER_LANGUAGE=zh → Reply entirely in Chinese.
- If USER_LANGUAGE=ja → Reply entirely in Japanese.
- If USER_LANGUAGE=fr → Reply entirely in French.
- If USER_LANGUAGE=en → Reply entirely in English.
- If no USER_LANGUAGE is set, detect the language of the user's message and reply in THAT SAME language.
- If the user wrote in Arabic → reply in Arabic. Period.
- NEVER reply in English when the user wrote in Arabic or any other language.

You are a senior developer explaining what you built/changed. Be concise and natural — like a real programmer talking to a colleague.

ADAPTIVE LENGTH RULES:
- NEW PROJECT (first version, many files generated): Write 4-6 bullet points describing the main features and sections built. Each point 1-2 sentences. Highlight the key features.
- EDIT/FIX (modifying existing project): Write 1-3 SHORT bullet points ONLY about what was changed. Each point under 15 words. Be minimal.
- SMALL FIX (1-2 files, typo, color change, simple bug fix): Return EMPTY string "". Do NOT write any explanation. The code speaks for itself.
- SIMPLE FEATURE ADD (adding a button, a field, a small component): Return EMPTY string "". Skip explanation entirely.

Rules:
- Only mention what ACTUALLY changed or was built
- Do NOT explain HOW you did it technically
- Do NOT list every single file
- Sound human
- Match the user's tone and language exactly
- If the change is trivial (< 3 files, simple logic), return "" (empty)

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

// ═══════════════════════════════════════════════
// AGENT LOOP PROMPTS (used only for mode === "code")
// ═══════════════════════════════════════════════

const AGENT_PLANNER_PROMPT = `You are a senior software architect. Analyze the user's request and return a JSON plan.
🌍 LANGUAGE RULE: If USER_LANGUAGE is set, write all human-readable text in that language.

Return ONLY valid JSON (no markdown fences, no extra text):
{
  "goal": "one-sentence summary of what to build",
  "subtasks": ["step 1", "step 2", ...],
  "files_needed": ["src/App.tsx", "src/components/Hero.tsx", ...],
  "complexity": "low" | "medium" | "high",
  "requires_fix_pass": true | false
}

Rules:
- Be specific about which files to create/modify
- List subtasks in execution order
- Set requires_fix_pass=true for complex multi-file projects
- complexity=high when 6+ files or complex state management`;

const AGENT_VALIDATOR_PROMPT = `You are a strict code reviewer. Review the generated code for bugs and issues.
🌍 LANGUAGE RULE: If USER_LANGUAGE is set, write issue descriptions in that language.

Return ONLY valid JSON (no markdown fences, no extra text):
{
  "confidence": 0-100,
  "issues": [
    { "file": "path/to/file", "line_hint": "near what code", "severity": "critical"|"warning", "description": "what's wrong" }
  ],
  "needs_fix": true | false,
  "fix_instructions": "specific instructions for fixing the issues"
}

Check for these CRITICAL issues:
1. Missing imports (any identifier used but not imported/declared)
2. Broken exports (import { X } but file exports default, or vice versa)
3. Missing context providers (useXxx() used but Provider not in component tree)
4. Unterminated strings or template literals
5. Undefined variables or functions
6. Wrong package imports (e.g., clsx from "tailwind-merge")
7. Missing files referenced by imports
8. Mismatched export/import names (case-sensitive)

confidence < 85 means needs_fix MUST be true.
If no issues found, return confidence: 95, needs_fix: false, issues: [].`;

const AGENT_FIXER_PROMPT = `You are a code fixer. You receive generated code and a list of issues. Fix ONLY the broken parts.
🌍 LANGUAGE RULE: If USER_LANGUAGE is set, write all UI text in that language.

Rules:
- Return ONLY the changed <FILE path="...">...</FILE> blocks
- Do NOT return files that don't need changes
- Keep all existing logic intact — only fix the specific issues
- After fixing, add <ACTIONS> and <SUMMARY> tags as usual
- NEVER introduce new bugs while fixing old ones`;

const CODE_GENERATION_PROMPT = `You are VIVORA X, an elite Full-Stack Engineer creating AWARD-WINNING, PORTFOLIO-GRADE web apps AND games.

═══════════════════════════════════════════════
ABSOLUTE RULES (VIOLATIONS = INSTANT FAILURE)
═══════════════════════════════════════════════

1. ⛔ THE TAILWIND MANDATE (ZERO TOLERANCE FOR RAW HTML):
   - You MUST style EVERY SINGLE HTML element using TailwindCSS.
   - Using bare elements like \`<button>Click me</button>\` or \`<h1>Title</h1>\` without Tailwind \`className\`s is a SEVERE VIOLATION.
   - It MUST look ultra-modern, heavily styled, and sleek by default. Use heavy padding, rounded corners, subtle shadows, grids, and flexboxes!

2. 🌍 LANGUAGE (ABSOLUTE — ZERO TOLERANCE):
   - If the user writes in Arabic → EVERY SINGLE WORD you output (summary, comments, button labels, placeholder text, alt text, aria-labels, page titles, section headings) MUST be in Arabic. NO EXCEPTIONS.
   - If USER_LANGUAGE=ar OR the user's prompt is in Arabic → respond ENTIRELY in Arabic. This includes code comments, string literals in JSX, and the <SUMMARY> section.
   - NEVER output English text when the user wrote in Arabic. Not even one English word in UI text.
   - The ONLY exception: code syntax (import, export, const, function names, CSS class names) stays in English because it's code.
   - Example: If user says "اعمل متجر ملابس" → button text must be "تسوق الآن" NOT "Shop Now", heading must be "اكتشف أحدث الموضة" NOT "Discover Latest Fashion".

2. ⛔ IMPORT/EXPORT CRASH PREVENTION (ZERO TOLERANCE — #1 CAUSE OF APP CRASHES):
   
   🔴 GOLDEN RULE: You MUST NOT write ANY import statement unless you are 100% certain the target file exports that exact name. If the file doesn't exist yet, you MUST create it in the same response with the correct export.

   🔴 COMMON CRASHES YOU MUST NEVER CAUSE:
   
   a) PACKAGE IMPORTS — Use the CORRECT package for each import:
      ✅ CORRECT: import { clsx } from "clsx";             (clsx comes from the "clsx" package)
      ✅ CORRECT: import { twMerge } from "tailwind-merge"; (twMerge comes from "tailwind-merge")
      ❌ WRONG:   import { clsx } from "tailwind-merge";    (clsx is NOT in tailwind-merge — CRASH!)
      ❌ WRONG:   import { cn } from "tailwind-merge";      (cn is NOT in tailwind-merge — CRASH!)
      
      If you create a utility function "cn" in lib/utils.ts, it should be:
      \`\`\`
      import { clsx, type ClassValue } from "clsx";
      import { twMerge } from "tailwind-merge";
      export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
      \`\`\`
      Then other files import: import { cn } from "../lib/utils";
      
   b) COMPONENT EXPORTS — Be consistent with named vs default exports:
      ✅ If a file has: export function Button() {...}  → import { Button } from "./Button";
      ✅ If a file has: export default function Button() {...} → import Button from "./Button";
      ❌ NEVER mix: export function Button() → import Button from (CRASH! — needs { Button })
      ❌ NEVER mix: export default function Button() → import { Button } from (CRASH! — needs default import)
      RULE: Pick ONE style and be consistent. RECOMMENDED: Use NAMED exports (export function/const) for all components. Then ALWAYS import with { }.
      
   c) CONTEXT HOOKS — Every custom hook MUST be exported from the file that creates it:
      ❌ CRASH: import { useAppContext } from "./contexts/AppContext" — but AppContext.tsx doesn't export "useAppContext"
      ✅ FIX: In AppContext.tsx you MUST write: export function useAppContext() { ... } or export const useAppContext = () => { ... }
      ❌ CRASH: import { useApp } from "./contexts/AppContext" — but the export is named "useAppContext" 
      ✅ FIX: The import name MUST match the export name EXACTLY, character for character.
      
   d) CONSTANTS FILE — If you tell files to import from lib/constants.ts, that file MUST export everything those files need:
      ❌ CRASH: Hero.tsx does import { TRANSLATIONS } from "../lib/constants" — but constants.ts exports "translations" (lowercase), not "TRANSLATIONS"
      ❌ CRASH: Navbar.tsx does import { translations } from "../lib/constants" — but constants.ts doesn't export "translations" at all
      ✅ FIX: If constants.ts has: export const translations = {...} → EVERY file must import { translations } (exact case match)
      ✅ FIX: If constants.ts has: export const TRANSLATIONS = {...} → EVERY file must import { TRANSLATIONS } (exact case match)
      
   e) PHANTOM FUNCTIONS — NEVER import functions that don't exist:
      ❌ CRASH: import { enhancePrompt } from "../lib/utils" — but utils.ts doesn't have enhancePrompt
      ❌ CRASH: import { formatDate } from "../lib/helpers" — but helpers.ts doesn't exist
      ✅ FIX: If you need a function, WRITE IT in the file you're importing from, in the same response.
      
   f) FILE PATH ACCURACY:
      ❌ CRASH: import { Button } from "../components/ui/Button" — but the actual file is "button.tsx" (lowercase)
      ✅ FIX: File paths are case-sensitive. Match the EXACT filename you created.

   MANDATORY SELF-AUDIT: Before outputting, go through EVERY file you generated and for EACH import line:
   1. Find the source file in your output
   2. Verify the export exists with the EXACT same name
   3. If it doesn't exist → either add the export to the source file OR fix the import
   This is NON-NEGOTIABLE. A single mismatched import = the entire app crashes.

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

5. FAVICON & OG IMAGE (MANDATORY):
   - index.html MUST include: <link rel="icon" href="https://www.vivorax.online/vivora-logo.png" type="image/png">
   - index.html MUST include: <meta property="og:image" content="https://vivorax.online/og-image.png">
   - index.html MUST include: <meta name="twitter:image" content="https://vivorax.online/og-image.png">

6. 📦 EXTERNAL PACKAGES & DEPENDENCIES (#4 CRASH AVOIDANCE):
   - You CAN use external packages like \`@clerk/clerk-react\`, \`zustand\`, \`framer-motion\`, \`recharts\`, \`date-fns\`, \`react-router-dom\`, etc.
   - 🚨 CRITICAL RULE: If you use ANY package not in the base set, YOU MUST GENERATE A \`package.json\` FILE AS THE VERY FIRST FILE IN YOUR RESPONSE.
   - Example: If the user asks for Clerk, generate \`<FILE path="package.json">{ "dependencies": { "@clerk/clerk-react": "latest" } }</FILE>\` as File #1.
   - Without generating the \`package.json\` FIRST, the app will crash because dependencies won't be ready when Vite starts.
   - 🛑 DO NOT MOCK: If API keys are provided, write the REAL logic. Mocking when keys are present is a failure.

7. LUCIDE ICONS (v0.263 SAFE LIST ONLY):
   Menu, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Search, Plus, Minus, Check, Copy, Edit, Trash2, Download, Upload, Share2, Send, Save, RefreshCw, LogOut, LogIn, Eye, EyeOff, Settings, Filter, Loader2, AlertCircle, Info, Bell, Heart, Star, ShoppingCart, CreditCard, MapPin, Globe, Phone, Mail, MessageSquare, Calendar, Clock, User, Users, Lock, Key, Shield, File, FileText, Folder, Database, Code, Sun, Moon, Zap, Award, TrendingUp, BarChart2, Activity, Home, Image, Play, Grid, Layout, Layers.
   NEVER USE: CircleUser, PanelLeft, Sparkles, Bot, BrainCircuit, Wand2, ListFilter, BadgeCheck, Blocks, LayoutGrid, or ANY icon not in the list above.

8. ESM ONLY. No require(). Always use optional chaining for nested access: obj?.prop ?? fallback.

9. App.tsx MUST: export default function App(). Use ThemeContext for dark/light. Use LanguageContext for i18n. 
   TRANSLATIONS: Create lib/constants.ts with: export const translations = { ... }; 
   Then import it as: import { translations } from "../lib/constants";
   NEVER use "TRANSLATIONS" (uppercase) unless that's the exact export name in constants.ts. The name MUST match.

10. DARK/LIGHT MODE: Mandatory. ThemeProvider + localStorage + system preference detection. Use CSS variables for all colors.

11. ⛔ UNDEFINED VARIABLE PREVENTION (ZERO TOLERANCE - CRITICAL):
    Every single variable, function, component, constant, or identifier used in JSX or logic MUST either be:
    a) Imported at the top of the file with a correct import statement, OR
    b) Defined/declared within the same file before usage.
    
    🔴 COMMON CRASHES YOU MUST NEVER CAUSE:
    - Using \`Globe\` in JSX but forgetting \`import { Globe } from "lucide-react";\` → ReferenceError: Globe is not defined
    - Using \`cn()\` but forgetting \`import { cn } from "../lib/utils";\` → ReferenceError: cn is not defined  
    - Using \`motion.div\` but forgetting \`import { motion } from "framer-motion";\` → ReferenceError: motion is not defined
    - Using \`useState\` but forgetting \`import { useState } from "react";\` → ReferenceError: useState is not defined
    - Using a component \`<Header />\` but forgetting to import or define it → ReferenceError: Header is not defined
    
    🔴 RULE: For EVERY identifier in your code, trace it back to its import or declaration. If you cannot find one → ADD IT IMMEDIATELY.
    This includes: React hooks, icons, utility functions (cn, clsx, twMerge), components, constants, types, and third-party APIs.
    
    🔴 SELF-CHECK: After writing each file, scan the entire file body for any name that is NOT:
    - A JavaScript keyword (const, let, if, return, etc.)
    - A parameter of a function/arrow in that file
    - Imported at the top
    - Declared/defined in the file
    If you find ANY such name → you have a bug. Fix it before outputting.

═══════════════════════════════════════════════
PRE-SUBMISSION CHECKLIST (MANDATORY — RUN BEFORE OUTPUTTING)
═══════════════════════════════════════════════
Before returning your code, you MUST mentally run these checks. Skipping them = broken app = failure:
✅ 1. IMPORT AUDIT: For EVERY import { X } from "./file" → open that file in your output → confirm "export function X" or "export const X" exists. If not → FIX IT NOW.
✅ 2. PACKAGE AUDIT: clsx from "clsx", twMerge from "tailwind-merge". NEVER cross-import.
✅ 3. CONTEXT AUDIT: Every useXxx() hook → is the Provider in App.tsx wrapping the component? If not → FIX IT.
✅ 4. CONTEXT ACCESS: Using optional chaining (state?.prop ?? default) for all context values? If not → FIX IT.
✅ 5. STRING AUDIT: Every className="" → is the string properly closed? No line breaks inside quotes? If not → FIX IT.
✅ 6. EXPORT NAME AUDIT: Every file's "export function X" → every importer uses exactly { X }, same casing. If not → FIX IT.
✅ 7. ICON AUDIT: All lucide-react icons → are they from the SAFE LIST above? If not → REPLACE with a safe icon.
✅ 8. PACKAGE AUDIT: Every import from a package → is it in the ALLOWED PACKAGES list (rule 6)? If not → REMOVE IT.
✅ 9. DEFAULT vs NAMED: If you wrote "export default function X", importers use "import X from". If you wrote "export function X", importers use "import { X } from". NEVER mix these.
✅ 10. UNDEFINED VARIABLE SCAN: For EVERY file, read through the JSX and logic. Every identifier used MUST have a matching import or local declaration. If Globe is used → "import { Globe } from lucide-react" must exist. If cn() is used → "import { cn } from ../lib/utils" must exist. NO EXCEPTIONS.

═══════════════════════════════════════════════
🎮 GAME DEVELOPMENT (When user requests a game)
═══════════════════════════════════════════════

When the user requests a GAME, create a FULLY PLAYABLE, PROFESSIONAL game with these requirements:

GAME ENGINE APPROACH:
- Use HTML5 Canvas via useRef<HTMLCanvasElement> for rendering
- Use requestAnimationFrame for the game loop
- Handle keyboard/touch input with addEventListener
- Use React state for UI overlays (score, menus, game over screen)

MANDATORY GAME FEATURES:
- SCORING SYSTEM: Track and display score, high score (localStorage), combo multipliers
- CHARACTER/PLAYER: Animated sprite or shape with smooth movement, acceleration, and physics
- ENEMIES/OBSTACLES: Multiple types with different behaviors, increasing difficulty
- LEVELS/WORLDS: At least 3 distinct levels/environments with different backgrounds, colors, and challenges
- COLLISION DETECTION: Precise rectangle or circle-based collision
- SOUND EFFECTS: Use Web Audio API for jump, hit, score, game over sounds (generate tones programmatically)
- PARTICLE EFFECTS: Explosions, trails, sparkles using canvas particle systems
- UI/HUD: Health bar, score display, level indicator, pause menu
- GAME STATES: Start screen → Playing → Pause → Game Over → Restart
- RESPONSIVE: Adapt canvas size to window, support both keyboard and touch controls
- DIFFICULTY PROGRESSION: Speed increases, more enemies, new patterns per level
- ANIMATIONS: Smooth sprite animations, screen shake on hit, flash effects
- POWER-UPS: At least 2 types (shield, speed boost, weapon upgrade, etc.)

GAME TYPES YOU CAN BUILD:
- Platformer (Mario-style): gravity, jumping, platforms, coins, enemies
- Space Shooter: ship movement, bullets, enemy waves, boss fights
- Runner/Endless: auto-scroll, obstacle dodge, increasing speed
- Puzzle: matching, sliding, logic challenges
- Fighting: 2-player or vs AI, health bars, combos
- RPG: character stats, inventory, turn-based or real-time combat
- Racing: top-down or side-view, checkpoints, opponents

GAME CODE STRUCTURE:
\`\`\`
components/
  Game.tsx          // Main game canvas + loop
  GameUI.tsx        // React overlay (score, menus, HUD)
  StartScreen.tsx   // Title screen with play button
  GameOver.tsx      // Game over screen with score
lib/
  gameEngine.ts     // Core game logic, physics, collision
  sprites.ts        // Character/enemy rendering functions
  levels.ts         // Level data and configurations
  sounds.ts         // Web Audio API sound generator
  particles.ts      // Particle effect system
types/
  game.ts           // Game-specific type definitions
\`\`\`

IMPORTANT GAME RULES:
- NEVER use external game libraries (no Phaser, no PixiJS). Pure Canvas + React only.
- ALL game assets must be drawn with Canvas API (shapes, gradients, paths) — no external images required.
- Game must be IMMEDIATELY playable — no setup, no loading, just press Play.
- Include clear instructions on the start screen.
- Game Over screen must show final score and "Play Again" button.
- MUST have at least 60 FPS smooth gameplay.

═══════════════════════════════════════════════
DESIGN QUALITY — LOVABLE-LEVEL PROFESSIONAL OUTPUT
═══════════════════════════════════════════════

🚨 YOUR OUTPUT MUST LOOK LIKE A $5,000+ PROFESSIONALLY DESIGNED WEBSITE.
The user will compare your output against Lovable.dev. If your design looks "cheap" or "AI-generated", it is a FAILURE.
Study these reference standards: Zamba store (clean product cards, warm orange accent, proper spacing), Stripe.com (clean typography, soft gradients), Apple.com (negative space mastery).

═══ STEP 1: DESIGN SYSTEM FIRST (before writing ANY component) ═══

Create index.css with a COMPLETE design system using CSS variables:
\`\`\`css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 3.9%;
  --primary: [CHOOSE A BRAND COLOR IN HSL];
  --primary-foreground: 0 0% 100%;
  --secondary: 0 0% 96.1%;
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;
  --accent: 0 0% 96.1%;
  --border: 0 0% 89.8%;
  --radius: 0.75rem;
}
.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  /* ... full dark mode tokens */
}
\`\`\`
ALL components MUST use these tokens: bg-background, text-foreground, bg-card, bg-primary, text-muted-foreground, border-border, etc.
NEVER write raw colors like bg-gray-800, text-white, bg-orange-500 in components. ALWAYS map to tokens.

═══ STEP 2: TYPOGRAPHY (THE #1 DIFFERENTIATOR) ═══

IMPORT premium Google Fonts in index.html <head>:
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">

FONT PAIRING PRESETS (pick ONE pair per project, NEVER reuse across projects):
1. Headings: "Plus Jakarta Sans" / Body: "Inter" — Clean SaaS
2. Headings: "Space Grotesk" / Body: "DM Sans" — Modern Tech  
3. Headings: "Outfit" / Body: "Work Sans" — Friendly E-commerce
4. Headings: "Syne" / Body: "Nunito Sans" — Bold Creative
5. Headings: "Manrope" / Body: "Source Sans 3" — Professional
6. Headings: "Playfair Display" / Body: "Lora" — Editorial/Luxury
7. Headings: "Cabinet Grotesk" / Body: "Satoshi" — Premium Minimal

Apply in tailwind config or index.css:
font-family: 'Plus Jakarta Sans', system-ui, sans-serif;

Typography Scale:
- Page title: text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight
- Section title: text-2xl md:text-3xl font-semibold  
- Card title: text-lg font-semibold
- Body: text-sm md:text-base text-muted-foreground leading-relaxed
- Small/caption: text-xs text-muted-foreground

═══ STEP 3: COLOR PALETTES (COHESIVE, NOT RANDOM) ═══

Pick ONE palette per project. The PRIMARY color defines the brand:

E-COMMERCE palettes:
- Warm: primary=#F97316 (orange), accent=#FCD34D, bg=white, cards=white, text=#1a1a1a
- Cool: primary=#3B82F6 (blue), accent=#06B6D4, bg=#FAFAFA, text=#0F172A  
- Luxury: primary=#D4AF37 (gold), accent=#1C1C1C, bg=#FAFAFA, text=#1a1a1a
- Nature: primary=#16A34A (green), accent=#84CC16, bg=white, text=#1a1a1a

SAAS palettes:
- Modern: primary=#6366F1 (indigo), accent=#8B5CF6, bg=white, text=#0F172A
- Trust: primary=#2563EB (blue), accent=#3B82F6, bg=#F8FAFC, text=#1E293B
- Bold: primary=#DC2626 (red), accent=#F97316, bg=white, text=#18181B

DARK MODE palettes:
- Charcoal: bg=#0F0F0F, card=#1A1A1A, border=#2A2A2A, primary=#3B82F6
- Navy: bg=#0C1222, card=#141B2D, border=#1E293B, primary=#818CF8

RULES:
- ONE dominant brand color + ONE accent + neutrals. That's it.
- Backgrounds must be clean: pure white, off-white (#FAFAFA), or dark (#0F0F0F).
- Never use more than 3 non-neutral colors in the entire site.
- Map ALL colors to CSS variables, never hardcode.

═══ STEP 4: COMPONENT QUALITY STANDARDS ═══

NAVBAR (every project needs a professional one):
\`\`\`
- Height: h-16, border-b border-border, bg-background/80 backdrop-blur-md sticky top-0 z-50
- Logo: text-xl font-bold text-foreground (left)
- Links: text-sm font-medium text-muted-foreground hover:text-foreground transition-colors (center or right)
- Actions: gap-2 flex items-center (right) — search icon, user avatar, cart badge
- Mobile: hamburger menu with Sheet component, animated
\`\`\`

PRODUCT/CONTENT CARDS:
\`\`\`
- Container: bg-card rounded-xl border border-border overflow-hidden group
- Image: aspect-square object-cover w-full group-hover:scale-105 transition-transform duration-500
- Content: p-4 space-y-2
- Category: text-xs font-medium text-primary uppercase tracking-wide
- Title: text-base font-semibold text-card-foreground line-clamp-2
- Rating: flex items-center gap-1 text-sm (star icon + number + review count in muted)
- Price: text-lg font-bold text-foreground
- Button: absolute bottom-4 right-4 h-10 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center
- Hover: hover:shadow-lg hover:-translate-y-1 transition-all duration-300
\`\`\`

HERO SECTIONS (SPLIT LAYOUT — MANDATORY FOR E-COMMERCE & LANDING PAGES):
\`\`\`
- Layout: grid grid-cols-1 md:grid-cols-2 gap-8 items-center — TEXT on LEFT, IMAGE on RIGHT
- Left side: Title (text-4xl md:text-6xl font-bold tracking-tight) + subtitle + CTA buttons + optional stats row
- Right side: High-quality product/hero image from Unsplash, rounded-2xl, with subtle shadow
- For e-commerce clothing stores, use this hero image: https://j.top4top.io/p_3717oeymi1.jpg
- Full width with generous py-20 md:py-32
- Background: clean bg-background or subtle gradient, NOT busy patterns
- CTA buttons: primary + ghost/outline variant, gap-4
- Stats row below CTA: flex gap-8 with bold numbers (200+ Brands, 2000+ Products, etc.)
- Optional: badge/pill above title for promotions
- Brand logos strip below hero: flex items-center gap-8 opacity-50 grayscale
\`\`\`

PROMO/BANNER CARDS:
\`\`\`
- bg-primary rounded-2xl p-8 text-primary-foreground
- Title: text-2xl font-bold
- Subtitle: text-sm opacity-80
- CTA: inline-flex items-center gap-2 (badge + link)
- Grid: grid-cols-1 md:grid-cols-3 gap-6
\`\`\`

BUTTONS:
\`\`\`
- Primary: bg-primary text-primary-foreground h-10 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors
- Secondary: bg-secondary text-secondary-foreground hover:bg-secondary/80
- Ghost: hover:bg-accent text-foreground
- ALL buttons: focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
- Icon buttons: h-10 w-10 rounded-full grid place-items-center
\`\`\`

FORMS & INPUTS:
\`\`\`
- h-10 px-3 rounded-lg border border-input bg-background text-sm
- focus:ring-2 focus:ring-ring focus:border-primary
- Labels: text-sm font-medium text-foreground mb-1.5
- Error states: border-destructive text-destructive text-sm mt-1
\`\`\`

═══ STEP 5: SPACING & LAYOUT SYSTEM ═══

PAGE LAYOUT:
- Container: max-w-7xl mx-auto px-4 md:px-6 lg:px-8
- Section spacing: py-16 md:py-24 (generous, NOT cramped)
- Section titles: mb-8 md:mb-12
- Grid gaps: gap-4 md:gap-6

GRIDS:
- Products: grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6
- Features: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8
- Stats: grid-cols-2 md:grid-cols-4 gap-4

CRITICAL SPACING RULES:
- Never stack elements without gap/space-y
- Cards MUST have consistent internal padding (p-4 or p-6)
- Images in cards MUST have aspect-ratio constraints (aspect-square or aspect-video)
- Sections MUST have visual separation (border-t, bg change, or large gap)

═══ STEP 6: IMAGES & MEDIA ═══

- Use high-quality Unsplash images: https://images.unsplash.com/photo-XXXX?w=800&q=80
- Product images: aspect-square object-cover rounded-lg
- Hero images: w-full aspect-video object-cover rounded-2xl or full-bleed
- Avatar images: h-10 w-10 rounded-full object-cover
- ALWAYS add loading="lazy" for below-fold images
- Hover zoom on product cards: group-hover:scale-105 transition-transform duration-500

═══ STEP 7: MOTION & ANIMATION ═══

Use framer-motion. Less is more — smooth, purposeful animations only:
- Page load: staggered fade-in (staggerChildren: 0.1, y: 20 -> 0, opacity: 0 -> 1)
- Scroll reveal: whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 30 }} viewport={{ once: true }}
- Hover: scale(1.02) on cards, scale(1.05) on images, color transitions on links
- Tab/page transitions: AnimatePresence with fade or slide
- Loading states: skeleton shimmer animation
- DO NOT over-animate. No bouncing, no spinning logos, no particle effects unless specifically requested.

═══ STEP 8: RESPONSIVE DESIGN ═══

- Mobile-first: Design for 375px, then scale up
- Breakpoints: sm:640px, md:768px, lg:1024px, xl:1280px
- Grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- Nav: Hamburger menu on mobile with Sheet/Drawer
- Text: text-2xl md:text-4xl lg:text-5xl (scale up, not down)
- Padding: px-4 md:px-6 lg:px-8
- Hide non-essential elements on mobile with hidden md:block

═══ ABSOLUTE ANTI-PATTERNS (INSTANT FAILURE) ═══

🚫 NEVER: Use raw HTML without Tailwind classes
🚫 NEVER: Hardcode colors (bg-gray-800) instead of tokens (bg-card)
🚫 NEVER: Use Arial, Times New Roman, or browser default fonts
🚫 NEVER: Create cards without proper padding, border-radius, and spacing
🚫 NEVER: Leave images without aspect-ratio or object-fit
🚫 NEVER: Stack content without gaps (space-y or gap)
🚫 NEVER: Use harsh gradients (rainbow, neon) unless specifically requested
🚫 NEVER: Create navbars without proper height, padding, and alignment
🚫 NEVER: Forget hover/focus states on interactive elements
🚫 NEVER: Use the same font/color scheme as a previous project
🚫 NEVER: Create layouts that look AI-generated or template-like

THREE.JS: Must use importmap in index.html, never bare npm import.

═══════════════════════════════════════════════
AI FEATURES (When user wants AI/chatbot)
═══════════════════════════════════════════════
Use the free Vivora X AI Gateway. NO API key needed. NO model selection needed.
Simply POST to: https://ai-gateway.vivorax.online/api/ai/generate
Body: { "prompt": "user message here", "config": { "stream": false, "temperature": 0.8, "max_tokens": 800 } }
Response: { "result": "AI response" }
This works for chatbots, text generation, recommendations, etc.

EXACT CODE PATTERN (copy this exactly):
\`\`\`
const AI_GATEWAY_URL = "https://ai-gateway.vivorax.online";

const response = await fetch(\`\${AI_GATEWAY_URL}/api/ai/generate\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: userMessage,
    config: {
      stream: false,
      temperature: 0.8,
      max_tokens: 800
    }
  })
});
const data = await response.json();
const aiReply = data.result;
\`\`\`
NEVER use any other AI endpoint. NEVER ask for API keys. NEVER specify a model name. Just use this exact pattern.

═══════════════════════════════════════════════
USER SECRETS & ENV VARIABLES
═══════════════════════════════════════════════
- If the user provides an API key or secret in the prompt (e.g. "use my OpenAI key sk-..."), you MUST use that EXACT key in the code. NEVER replace it with a demo/placeholder value.
- Store user-provided keys in a .env file and reference via import.meta.env.VITE_*
- If the user says "use the key from env" or "use the secret", reference import.meta.env.VITE_* variables.
- NEVER create demo/mock implementations when the user has provided real credentials. Use the real API with the real key.
- For server-side secrets, create a .env file entry and use it in the code.

═══════════════════════════════════════════════
ADMIN DASHBOARD (when requested OR when project type needs it)
═══════════════════════════════════════════════
- FULLY FUNCTIONAL, not mockup. Context+useReducer for state. Full CRUD with modals/forms/validation/toasts.
- Sidebar with icons, auth with password login, 5-10 sample items.
- EVERY button must work. No empty handlers.

🛑 AUTO-GENERATE ADMIN PANEL FOR THESE PROJECT TYPES:
When the user requests a Restaurant website, E-commerce store, Portfolio, Blog, LinkTree/link-in-bio, SaaS, Booking system, or any site with DATA MANAGEMENT needs:
- You MUST create a /admin route with a full admin dashboard.
- The admin panel should manage: menu items (for restaurants), products (e-commerce), links (linktree), blog posts (blogs), bookings (booking systems), etc.
- Include CRUD operations: Add, Edit, Delete with modals/dialogs.
- Include summary statistics (total items, revenue, etc.) on the admin overview.
- Admin login should use a simple password (hardcoded "admin123" for demo OR a context-based auth).
- The admin panel should be separate from the main site design with its own dark professional layout.

🤖 AI ASSISTANT — AUTO-ADD WHEN BENEFICIAL:
When the project is a SaaS, customer support site, educational platform, e-commerce, or ANY site where an AI chatbot would add value:
- Add a floating AI chat widget (bottom-right corner) using the Vivora X AI Gateway.
- Use the pattern: POST https://ai-gateway.vivorax.online/api/ai/generate with { "prompt": "...", "config": { "stream": false, "temperature": 0.8, "max_tokens": 800 } }
- The chatbot should have a clean UI: expandable bubble, message history, typing indicator.
- Customize the chatbot personality based on the project type (e.g., "restaurant assistant", "shopping helper").

═══════════════════════════════════════════════
PROJECT STRUCTURE (new projects): 15-25 files minimum
═══════════════════════════════════════════════
index.html, main.tsx, App.tsx, index.css, types/index.ts, contexts/, hooks/, components/ui/, components/, pages/, vercel.json, robots.txt, sitemap.xml.

═══════════════════════════════════════════════
EDITING RULES (CRITICAL — DESIGN PRESERVATION)
═══════════════════════════════════════════════

⛔ DESIGN PRESERVATION (ZERO TOLERANCE):
When the user asks to FIX A BUG, ADD A FEATURE, or MODIFY FUNCTIONALITY:
- NEVER change colors, fonts, spacing, layout, gradients, shadows, or any visual styling UNLESS the user EXPLICITLY asked for a design change.
- NEVER reorganize or restructure components that the user didn't mention.
- NEVER remove or alter animations, hover effects, or transitions that already exist.
- ONLY touch the files and the specific lines related to the user's request.
- If the user says "fix the login bug" → fix ONLY the login logic. Do NOT touch the login page's design.
- If the user says "add a search feature" → add the search feature WITHOUT changing existing component styles.
- Treat the existing design as SACRED and READ-ONLY unless the user says otherwise.

⛔ INCREMENTAL EDITING (MANDATORY FOR EDITS):
When editing an existing project (not creating a new one):
- Output ONLY the files that need changes. Do NOT re-output unchanged files.
- For each changed file, output the COMPLETE file content (all lines), but ONLY modify the specific parts related to the user's request.
- Keep ALL existing code, imports, styles, and structure intact.
- Think of it as "surgical editing" — change the minimum number of lines to achieve the goal.
- NEVER rewrite a file from scratch when only a few lines need to change.

═══════════════════════════════════════════════
SUMMARY FORMATTING
═══════════════════════════════════════════════
In <SUMMARY> blocks, write plain text ONLY. NEVER use ** or ## or __ markdown formatting. Use simple numbered lists.
🌍 CRITICAL: The <SUMMARY> MUST be in the SAME language as the user's message. If user wrote Arabic → summary in Arabic. If user wrote French → summary in French. NEVER write summary in English when user used another language.

═══════════════════════════════════════════════
OUTPUT FORMAT (ABSOLUTE - NO EXCEPTIONS)
═══════════════════════════════════════════════
Return ONLY these blocks in this exact order:
1. <FILE path="relative/path.ext">complete file content</FILE> (repeat for each file)
2. <ACTIONS> with one JSON object per line: {"name":"filename","action":"created|edited|deleted","status":"done"}
3. <SUMMARY>plain text summary</SUMMARY>

NEVER use <FILE name="...">. NEVER output markdown code fences. 
index.html MUST include: <script src="https://www.vivorax.online/branding.js" defer></script>
index.html MUST include: <script src="https://www.vivorax.online/analyzer.js" defer></script>`;

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

// ═══════════════════════════════════════════════
// AGENT LOOP — multi-step plan → generate → validate → fix
// ═══════════════════════════════════════════════

interface AgentCallOptions {
  model: string;
  gatewayUrl: string;
  authToken: string;
}

async function agentCall(
  opts: AgentCallOptions,
  systemPrompt: string,
  messages: any[],
  maxTokens = 4000,
  temperature = 0.2,
): Promise<string> {
  const res = await fetch(opts.gatewayUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: false,
      max_tokens: maxTokens,
      temperature,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Agent sub-call failed (${res.status}): ${t}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// Streaming variant — forwards SSE chunks to the client controller in real-time
async function agentCallStreaming(
  opts: AgentCallOptions,
  systemPrompt: string,
  messages: any[],
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  maxTokens = 65000,
  temperature = 0.1,
): Promise<string> {
  const res = await fetch(opts.gatewayUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
      max_tokens: maxTokens,
      temperature,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Agent streaming call failed (${res.status}): ${t}`);
  }

  if (!res.body) throw new Error("No response body from streaming call");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;

      const payload = line.slice(6).trim();
      if (payload === "[DONE]") continue;

      try {
        const parsed = JSON.parse(payload);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) {
          fullText += content;
          // Forward chunk to client in real-time
          const sseChunk = { choices: [{ delta: { content } }] };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(sseChunk)}\n\n`));
        }
      } catch {
        // partial JSON, skip
      }
    }
  }

  return fullText;
}

function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

async function runAgentLoop(
  opts: AgentCallOptions,
  systemPrompt: string,
  finalMessages: any[],
  userLanguage: string,
): Promise<ReadableStream> {
  const encoder = new TextEncoder();
  const MAX_FIX_ITERATIONS = 2;

  return new ReadableStream({
    async start(controller) {
      try {
        // ── STEP 1: PLAN ──
        controller.enqueue(encoder.encode(sseEvent({
          step: "planning", message: userLanguage === "ar" ? "جاري التخطيط وتحليل المطلوب..." : "Planning and analyzing the request..."
        })));

        let plan: any = {};
        try {
          const planRaw = await agentCall(opts, AGENT_PLANNER_PROMPT, finalMessages, 4000, 0.3);
          const jsonMatch = planRaw.match(/\{[\s\S]*\}/);
          plan = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        } catch (e) {
          console.warn("[agent] Planner failed, continuing without plan:", e);
          plan = { goal: "generate code", subtasks: [], files_needed: [], complexity: "medium", requires_fix_pass: true };
        }

        console.log("[agent] Plan:", JSON.stringify(plan));

        // ── STEP 2: GENERATE (live streaming to client) ──
        controller.enqueue(encoder.encode(sseEvent({
          step: "generating", message: userLanguage === "ar" ? "جاري توليد الكود..." : "Generating code..."
        })));

        const planInjection = `\n\n[AGENT PLAN — follow this structure]\nGoal: ${plan.goal || "fulfill request"}\nSubtasks: ${(plan.subtasks || []).join(", ")}\nFiles needed: ${(plan.files_needed || []).join(", ")}\nComplexity: ${plan.complexity || "medium"}\n`;

        // Inject plan into last user message
        const genMessages = [...finalMessages];
        const lastUserIdx = genMessages.findLastIndex((m: any) => m.role === "user");
        if (lastUserIdx >= 0) {
          genMessages[lastUserIdx] = {
            ...genMessages[lastUserIdx],
            content: appendTextToMessageContent(genMessages[lastUserIdx].content, planInjection),
          };
        }

        // Stream code generation live — chunks forwarded to client in real-time
        let generatedCode = await agentCallStreaming(opts, systemPrompt, genMessages, controller, encoder, 65000, 0.1);

        // ── STEP 3-5: VALIDATE → FIX loop ──
        let confidence = 0;
        for (let iteration = 0; iteration < MAX_FIX_ITERATIONS; iteration++) {
          controller.enqueue(encoder.encode(sseEvent({
            step: "validating",
            message: userLanguage === "ar"
              ? `جاري مراجعة الكود (محاولة ${iteration + 1})...`
              : `Validating code (pass ${iteration + 1})...`,
          })));

          let validation: any = { confidence: 95, needs_fix: false, issues: [] };
          try {
            const valRaw = await agentCall(
              opts,
              AGENT_VALIDATOR_PROMPT,
              [{ role: "user", content: `Review this generated code:\n\n${generatedCode}` }],
              4000,
              0.1,
            );
            const jsonMatch = valRaw.match(/\{[\s\S]*\}/);
            validation = jsonMatch ? JSON.parse(jsonMatch[0]) : validation;
          } catch (e) {
            console.warn("[agent] Validator failed, assuming OK:", e);
          }

          confidence = validation.confidence ?? 95;
          console.log(`[agent] Validation pass ${iteration + 1}: confidence=${confidence}, issues=${(validation.issues || []).length}`);

          controller.enqueue(encoder.encode(sseEvent({
            step: "validating",
            message: userLanguage === "ar"
              ? `الثقة: ${confidence}%`
              : `Confidence: ${confidence}%`,
            confidence,
          })));

          if (confidence >= 85 && !validation.needs_fix) {
            console.log("[agent] Code passed validation, skipping fix.");
            break;
          }

          // ── FIX ──
          const issuesCount = (validation.issues || []).length;
          controller.enqueue(encoder.encode(sseEvent({
            step: "fixing",
            message: userLanguage === "ar"
              ? `جاري إصلاح ${issuesCount} مشكلة...`
              : `Fixing ${issuesCount} issue(s)...`,
            issues_count: issuesCount,
          })));

          try {
            const fixResult = await agentCall(
              opts,
              AGENT_FIXER_PROMPT,
              [
                { role: "user", content: `Original code:\n${generatedCode}\n\nIssues found:\n${JSON.stringify(validation.issues)}\n\nFix instructions: ${validation.fix_instructions || "Fix all issues listed above."}` },
              ],
              65000,
              0.1,
            );

            // Merge fixed files back into generated code
            const fixedFileRegex = /<FILE\s+path="([^"]+)">([\s\S]*?)<\/FILE>/gi;
            let match;
            let mergedCode = generatedCode;
            while ((match = fixedFileRegex.exec(fixResult)) !== null) {
              const [fullBlock, filePath, fileContent] = match;
              const existingPattern = new RegExp(
                `<FILE\\s+path="${filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">[\\s\\S]*?</FILE>`,
                'gi'
              );
              if (existingPattern.test(mergedCode)) {
                mergedCode = mergedCode.replace(existingPattern, fullBlock);
              } else {
                // New file from fixer — append before ACTIONS/SUMMARY
                const insertPoint = mergedCode.search(/<ACTIONS>/i);
                if (insertPoint > -1) {
                  mergedCode = mergedCode.slice(0, insertPoint) + fullBlock + "\n" + mergedCode.slice(insertPoint);
                } else {
                  mergedCode += "\n" + fullBlock;
                }
              }
            }
            generatedCode = mergedCode;
          } catch (e) {
            console.warn("[agent] Fixer failed, using last version:", e);
            break;
          }
        }

        // ── STEP 6: FINALIZE ──
        // Code was already streamed live during generation (step 2).
        // If fixes were applied, stream only the patched delta.
        if (generatedCode !== originalGeneratedCode) {
          controller.enqueue(encoder.encode(sseEvent({
            step: "streaming", message: userLanguage === "ar" ? "جاري إرسال الإصلاحات..." : "Streaming fixes..."
          })));
          // Re-stream the entire fixed code so the client gets the corrected version
          const CHUNK_SIZE = 200;
          for (let i = 0; i < generatedCode.length; i += CHUNK_SIZE) {
            const chunk = generatedCode.slice(i, i + CHUNK_SIZE);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`));
          }
        }

        // Send done markers
        controller.enqueue(encoder.encode(sseEvent({ step: "done" })));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        console.error("[agent] Agent loop error:", err);
        const errorMsg = err instanceof Error ? err.message : "Agent loop failed";
        controller.enqueue(encoder.encode(sseEvent({ step: "error", message: errorMsg })));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });
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
- BRANDING: index.html must include: <script src="https://www.vivorax.online/branding.js" defer></script>. This script adds a "Made in Vivorax" badge. The badge text MUST BE BLACK at all times.
- ANALYTICS: index.html must include: <script src="https://www.vivorax.online/analyzer.js" defer></script>
- TAILWIND CDN: index.html MUST include: <script src="https://cdn.tailwindcss.com"></script> inside the <head>.
- CONFIG FILES: YOU MUST GENERATE tailwind.config.js and postcss.config.js so the app compiles properly. IMPORTANT: You MUST use \`export default\` instead of \`module.exports\` in these files because the project uses ES Modules!
- FAVICON: index.html must include: <link rel="icon" href="https://www.vivorax.online/vivora-logo.png" type="image/png">
- OG IMAGE: index.html must include: <meta property="og:image" content="https://vivorax.online/og-image.png">
- AI features: Use https://ai-gateway.vivorax.online/api/ai/generate (free, no key needed). POST { "prompt": "...", "config": { "stream": false, "temperature": 0.8, "max_tokens": 800 } } → { "result": "..." }. No API key. No model selection. Use the EXACT fetch pattern from the system prompt.
- 🛑 NO MOCKING APIS: If the user provides an API key (e.g., Clerk Auth, Google API, OpenAI), YOU MUST WRITE THE REAL IMPLEMENTATION. Do NOT mock it or drop the logic. For Auth, use the real Provider. For Google API, write the actual \`fetch\` call to the endpoint. Do NOT fake it.
- USER SECRETS: If the user provided API keys or secrets in the prompt, USE THEM EXACTLY. NEVER replace with demo/placeholder. Store in .env as VITE_* and reference via import.meta.env.VITE_*.
- HERO BACKGROUNDS: Use high-quality Unsplash images or CSS gradient backgrounds for hero sections. Do NOT use video backgrounds or CDN video URLs.
- THREE.JS: importmap in index.html required, never bare npm import
- IMAGES: Analyze attached images and recreate/fix designs accordingly
- SCROLL ANIMATIONS: Use framer-motion useInView, useScroll, useTransform for scroll-driven animations. Add parallax, staggered reveals, animated counters, typing effects, and marquee tickers.
- 🎨 DESIGN MANDATE (CRITICAL): The design MUST be ultra-premium, sleek, aligned, and beautiful (Awwwards-level). Extensive use of padding (p-8, py-24), grid/flex alignment, rounded-3xl corners, and glassmorphism. DO NOT return raw HTML. EVERY SINGLE ELEMENT MUST have Tailwind classes.
- 🚀 ANIMATION MANDATE: Site MUST feel alive. Use stagger reveals, scroll-triggered fades, typing effects, and smooth transitions on every interaction.
- 🛑 NO MOCKING: If real API keys are provided (Clerk, Google, OpenAI, etc.), you MUST write the REAL production implementation code. No demo/mock logic!
- 📦 PACKAGE ORDER: If you use external packages, File #1 MUST be 'package.json'. No exceptions.

⛔ IMPORT/EXPORT SAFETY (FINAL REMINDER — VIOLATIONS = BROKEN APP):
- clsx comes from "clsx" package. twMerge comes from "tailwind-merge". NEVER import clsx from tailwind-merge.
- Every import { X } MUST have a matching export in the target file. Verify before outputting.
- Use NAMED exports consistently: export function Button() → import { Button }. Do NOT mix named/default.
- Context hooks (useApp, useCart, etc.) MUST be exported from the file that creates them.
- Constants: If you export "translations" (lowercase), import "translations" (lowercase). Case MUST match.
- NEVER import functions that don't exist (e.g., enhancePrompt, formatDate) unless you create them.
- FORBIDDEN PACKAGES BAN LIFTED: You MAY use third party packages (like clerk, recharts, react-router), but YOU MUST GENERATE a 'package.json' file in your response WITH THE DEPENDENCIES LISTED.
- Run the PRE-SUBMISSION CHECKLIST from system prompt before outputting. One wrong import = app crash.`;

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

    // ═══════════════════════════════════════════════
    // AGENT LOOP for code mode — multi-step generation
    // ═══════════════════════════════════════════════
    if (mode === "code") {
      const agentOpts: AgentCallOptions = { model, gatewayUrl, authToken };
      const agentStream = await runAgentLoop(agentOpts, systemPrompt, finalMessages, userLanguage || "en");
      return new Response(agentStream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // ═══════════════════════════════════════════════
    // ALL OTHER MODES — original behavior unchanged
    // ═══════════════════════════════════════════════
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
        ...(shouldStream ? { stream_options: { include_usage: true } } : {}),
        max_tokens: maxTokens,
        temperature: mode === "credit" ? 0 : 0.4,
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
