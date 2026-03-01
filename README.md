# Vivora X — AI-Powered Code Generation Platform

> Build full-stack web apps from natural language prompts. Describe your idea, get a production-ready Vite + React + TypeScript project in seconds.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Vite + React)           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  Editor   │ │ Dashboard│ │  Auth    │            │
│  │  Layout   │ │ Projects │ │  Pages   │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  Chat AI  │ │ Preview  │ │  Visual  │            │
│  │  View     │ │ Sandbox  │ │  Editor  │            │
│  └──────────┘ └──────────┘ └──────────┘            │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────────┐
│              Supabase (Backend)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  Auth    │ │ Database │ │ Storage  │            │
│  │  (Email) │ │ Postgres │ │ (Images) │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────────────────────────────────┐           │
│  │         Edge Functions (Deno)        │           │
│  │  generate-code · modal-proxy         │           │
│  │  github-push · vercel-deploy         │           │
│  │  visual-edits · admin-data           │           │
│  │  paypal-* · upload-image             │           │
│  └──────────────────────────────────────┘           │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│           External Services                          │
│  Modal (Sandbox) · GitHub · Vercel · PayPal         │
│  AI Gateway (Gemini/OpenRouter) · Cloudflare R2     │
└─────────────────────────────────────────────────────┘
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **AI Code Generation** | Stream code from AI models (Gemini, OpenRouter) with real-time file detection |
| **Awwwards-Level Design** | Generated projects follow premium design standards with serif fonts, parallax, and motion |
| **Clone Design** | Enter any website URL — Vivora X scrapes & recreates it as a React project (all plans) |
| **Multimodal Image Analysis** | Upload up to 5 images per prompt for design reference & analysis |
| **Live Preview** | Sandbox-based preview via Modal containers |
| **Visual Editor** | Click-to-edit UI elements, AI applies CSS/content changes |
| **Version History** | Save/restore project versions with diff tracking & AI-generated names |
| **GitHub Integration** | Push projects directly to GitHub repos |
| **Vercel Deployment** | One-click deploy to Vercel |
| **Cloudflare Deployment** | Deploy to Cloudflare Pages with custom subdomains |
| **Multi-language UI** | Arabic, English, French, Spanish, German, Japanese, Korean, Chinese (full RTL) |
| **Credit System** | Daily + monthly credits with plan-based limits |
| **Promo Codes** | Public discount codes displayed on pricing plan cards |
| **PayPal Billing** | Upgrade plans (Free → Pro → Business) |
| **Email Notifications** | Welcome, plan upgrade, and renewal reminder emails via Resend |
| **Custom Cursor** | Premium branded cursor throughout the platform |
| **Wallpaper Customization** | 8 premium wallpapers: Space, Light, Nebula, Sunset, Forest, Ocean, Mountains, City Night |
| **Admin Panel** | User management, AI model config, blog CMS, notifications |
| **Blog System** | Category-based blog with markdown content |
| **Dark/Light Theme** | System-aware theming with manual override (3-way cycle) |
| **Image Upload to R2** | Chat images stored on Cloudflare R2 with CDN delivery |
| **Premium Branding** | "Built with Vivora X" badge with animated logo on generated projects |
| **3D & Immersive Web** | Generate Three.js-powered 3D product viewers, particle systems |
| **Voice Input** | Speech-to-text on homepage with multi-language support |
| **Color Themes** | Choose from 10 color palettes injected into AI generation prompts |
| **Billing Dashboard** | View plan details, subscription expiry, transaction history |

---

## 📁 Project Structure

```
├── src/
│   ├── App.tsx                    # Router + main app logic
│   ├── main.tsx                   # Entry point
│   ├── index.css                  # Design tokens + Tailwind
│   ├── components/
│   │   ├── auth/                  # Login/signup pages
│   │   ├── dashboard/             # Projects dashboard
│   │   ├── editor/                # Code editor, chat, preview, versions
│   │   ├── home/                  # Landing page sections
│   │   ├── pricing/               # PromoCodeSection
│   │   ├── shared/                # Reusable components (footer, modals, logo, etc.)
│   │   └── ui/                    # shadcn/ui primitives
│   ├── contexts/
│   │   ├── AuthContext.tsx         # Auth state management
│   │   └── LanguageContext.tsx     # i18n translations (8 languages + RTL)
│   ├── hooks/                     # Custom React hooks
│   ├── services/
│   │   ├── aiService.ts           # AI streaming + response parsing
│   │   ├── directAiService.ts     # Direct AI API calls + credits
│   │   ├── creditService.ts       # Credit management
│   │   ├── paypalService.ts       # PayPal integration
│   │   ├── versionNameService.ts  # AI-generated version names
│   │   └── visualEditService.ts   # Visual edit parsing
│   ├── pages/                     # Route pages
│   ├── types/                     # TypeScript interfaces
│   ├── lib/                       # Utilities (cn, theme, plans)
│   └── integrations/supabase/     # Auto-generated Supabase client + types
│
├── supabase/
│   ├── config.toml                # Supabase project config
│   ├── migrations/                # Incremental SQL migrations
│   └── functions/
│       ├── admin-data/            # Admin dashboard data endpoint
│       ├── generate-code/         # Main AI code generation (SSE streaming)
│       ├── github-push/           # GitHub OAuth + repo push
│       ├── modal-proxy/           # Modal sandbox provisioning
│       ├── paypal-capture-order/  # PayPal order capture + plan upgrade
│       ├── paypal-create-order/   # PayPal order creation
│       ├── scrape-website/        # Website scraping for Clone Design
│       ├── send-notification-email/ # Email notifications (Resend)
│       ├── upload-image/          # Image upload to Cloudflare R2
│       ├── vercel-deploy/         # Vercel deployment API
│       └── visual-edits/          # AI-powered visual code edits
│
├── full.sql                       # Complete DB schema (single file)
└── public/
    ├── branding.js                # "Built with Vivora X" badge
    ├── wallpapers/                # 8 premium wallpaper images
    └── sounds/                    # UI sound effects
```

---

## 🗃️ Database Schema

### Tables (18 total)

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (display name, avatar, email) |
| `projects` | User projects with files (JSONB), metadata, deploy URLs |
| `project_versions` | Version history snapshots with chat messages |
| `chat_messages` | Chat messages per project (with image URLs) |
| `user_plans` | Subscription plans + daily/monthly credit tracking |
| `credit_transactions` | Credit usage log per generation |
| `user_integrations` | GitHub/Vercel tokens & connection status |
| `user_roles` | Admin/moderator/user role assignments |
| `generation_jobs` | Background AI generation queue |
| `sandbox_mappings` | Modal sandbox URL mappings (auto-expire) |
| `blog_posts` | Blog articles with publish workflow |
| `blog_categories` | Blog categories with ordering |
| `inbox_notifications` | System notifications (plan-targeted) |
| `user_notification_reads` | Read status tracking per user |
| `templates` | Project templates with categories |
| `ai_model_config` | AI model configuration per plan |
| `promo_codes` | Discount promo codes with usage tracking |
| `vivora_deployments` | Cloudflare Pages deployments |

### Enums

- `plan_type`: free, pro, business
- `app_role`: admin, moderator, user

---

## 🔐 Security

- **Row Level Security (RLS)** enabled on all tables
- Users can only access their own data (projects, messages, plans)
- Admin operations gated by `has_role()` function
- Service role used only in edge functions for cross-user operations
- Image uploads secured via JWT authentication

---

## ⚙️ Edge Functions

| Function | Method | Auth | Description |
|----------|--------|------|-------------|
| `generate-code` | POST | JWT | AI code generation with SSE streaming |
| `modal-proxy` | POST | Anon | Provisions Modal sandbox containers |
| `visual-edits` | POST | JWT | AI-powered visual code modifications |
| `github-push` | POST | JWT | GitHub OAuth flow + file push |
| `vercel-deploy` | POST | JWT | Vercel project deployment |
| `admin-data` | GET | JWT+Admin | Fetch admin dashboard data |
| `upload-image` | POST | JWT | Upload images to Cloudflare R2 |
| `scrape-website` | POST | JWT | Website scraping for Clone Design |
| `send-notification-email` | POST | JWT | Email notifications via Resend |
| `paypal-create-order` | POST | JWT | Create PayPal checkout order |
| `paypal-capture-order` | POST | JWT | Capture PayPal payment + upgrade plan |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ / Bun
- Supabase CLI (for local development)

### 1. Install Dependencies

```bash
npm install
# or
bun install
```

### 2. Environment Variables

The `.env` file is auto-configured with:

```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
VITE_SUPABASE_PROJECT_ID=<project-id>
```

### 3. Database Setup

Run the full schema on a fresh Supabase project:

```bash
psql <DATABASE_URL> -f full.sql
```

Or apply incremental migrations via Supabase CLI:

```bash
supabase db push
```

### 4. Required Secrets (Edge Functions)

| Secret | Used By |
|--------|---------|
| `VERCEL_AI_API_KEY` | generate-code |
| `OPENROUTER_API_KEY` | visual-edits |
| `MODAL_API_URL` | modal-proxy |
| `R2_ACCESS_KEY_ID` | upload-image |
| `R2_SECRET_ACCESS_KEY` | upload-image |
| `R2_ENDPOINT` | upload-image |
| `R2_PUBLIC_URL` | upload-image |
| `PAYPAL_CLIENT_ID` / `PAYPAL_SECRET` | paypal-create-order, paypal-capture-order |
| `RESEND_API_KEY` | send-notification-email |

### 5. Run Development Server

```bash
npm run dev
# or
bun dev
```

App runs at `http://localhost:5173`

---

## 📊 Credit System

| Plan | Price | Daily Credits | Monthly Credits |
|------|-------|--------------|-----------------|
| **Free** | $0 | 3 | 0 |
| **Pro** | $15/mo | 5 | 150 |
| **Business** | $29/mo | 10 | 400 |

### Features by Plan

| Feature | Free | Pro | Business |
|---------|------|-----|----------|
| Clone Design | ✅ | ✅ | ✅ |
| Image Upload | ❌ | ✅ | ✅ |
| ZIP Export | ❌ | ✅ | ✅ |
| Private Projects | ❌ | ✅ | ✅ |
| Priority Access | ❌ | ❌ | ✅ |
| Vercel Deploy | ✅ | ✅ | ✅ |

Credits reset daily at UTC midnight. First project generation costs 2 credits; edits cost 0.5–3 credits based on file count.

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui, Framer Motion |
| State | React Query, React Context |
| Backend | Supabase (Postgres, Auth, Edge Functions, Storage) |
| AI | Gemini (via AI Gateway), OpenRouter |
| Code Editor | Monaco Editor |
| Sandbox | Modal (containerized preview) |
| Image Storage | Cloudflare R2 + CDN |
| Payments | PayPal |
| Email | Resend (no-reply@vivorax.online) |
| Deployment | Vercel, GitHub, Cloudflare Pages |

---

## 📄 License

Proprietary — All rights reserved.

