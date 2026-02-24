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
│  │  visual-edits · background-generate  │           │
│  │  admin-data · paypal-*               │           │
│  └──────────────────────────────────────┘           │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│           External Services                          │
│  Modal (Sandbox) · GitHub · Vercel · PayPal         │
│  AI Gateway (Gemini/OpenRouter)                      │
└─────────────────────────────────────────────────────┘
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **AI Code Generation** | Stream code from AI models (Gemini, OpenRouter) with real-time file detection |
| **Live Preview** | Sandbox-based preview via Modal containers |
| **Visual Editor** | Click-to-edit UI elements, AI applies CSS/content changes |
| **Version History** | Save/restore project versions with diff tracking |
| **GitHub Integration** | Push projects directly to GitHub repos |
| **Vercel Deployment** | One-click deploy to Vercel |
| **Multi-language UI** | Arabic, English, French, Spanish, German, Japanese, Korean, Chinese |
| **Credit System** | Daily + monthly credits with plan-based limits |
| **PayPal Billing** | Upgrade plans (Free → Pro → Business) |
| **Admin Panel** | User management, model config, blog, notifications |
| **Blog System** | Category-based blog with markdown content |
| **Dark/Light Theme** | System-aware theming with manual override |

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
│   │   ├── shared/                # Reusable components (footer, modals, etc.)
│   │   └── ui/                    # shadcn/ui primitives
│   ├── contexts/
│   │   ├── AuthContext.tsx         # Auth state management
│   │   └── LanguageContext.tsx     # i18n translations
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
│       ├── background-generate/   # Background code generation jobs
│       ├── generate-code/         # Main AI code generation (SSE streaming)
│       ├── github-push/           # GitHub OAuth + repo push
│       ├── modal-proxy/           # Modal sandbox provisioning
│       ├── paypal-capture-order/  # PayPal order capture + plan upgrade
│       ├── paypal-create-order/   # PayPal order creation
│       ├── vercel-deploy/         # Vercel deployment API
│       └── visual-edits/          # AI-powered visual code edits
│
├── full.sql                       # Complete DB schema (single file)
└── public/                        # Static assets
```

---

## 🗃️ Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (display name, avatar, email) |
| `projects` | User projects with files (JSONB), metadata, deploy URLs |
| `project_versions` | Version history snapshots |
| `chat_messages` | Chat messages per project |
| `user_plans` | Subscription plans + credit tracking |
| `credit_transactions` | Credit usage log |
| `user_integrations` | GitHub/Vercel tokens |
| `user_roles` | Admin/moderator/user roles |
| `generation_jobs` | Background AI generation queue |
| `sandbox_mappings` | Modal sandbox URL mappings |
| `blog_posts` | Blog articles |
| `blog_categories` | Blog categories |
| `inbox_notifications` | System notifications |
| `user_notification_reads` | Read status tracking |
| `templates` | Project templates |
| `ai_model_config` | AI model configuration per plan |
| `oauth_pkce_store` | Temporary PKCE state for OAuth flows |
| `vivora_deployments` | Cloudflare Pages deployments |

### Enums

- `plan_type`: free, pro, business (+ legacy: spark, builder, creator, scale)
- `app_role`: admin, moderator, user

---

## 🔐 Security

- **Row Level Security (RLS)** enabled on all tables
- Users can only access their own data (projects, messages, plans)
- Admin operations gated by `has_role()` function
- Service role used only in edge functions for cross-user operations

---

## ⚙️ Edge Functions

| Function | Method | Auth | Description |
|----------|--------|------|-------------|
| `generate-code` | POST | JWT | AI code generation with SSE streaming |
| `modal-proxy` | POST | Anon | Provisions Modal sandbox containers |
| `background-generate` | POST | Service | Background generation job processor |
| `visual-edits` | POST | JWT | AI-powered visual code modifications |
| `github-push` | POST | JWT | GitHub OAuth flow + file push |
| `vercel-deploy` | POST | JWT | Vercel project deployment |
| `admin-data` | GET | JWT+Admin | Fetch admin dashboard data |
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

Configure these in your Supabase project → Edge Functions → Secrets:

| Secret | Used By |
|--------|---------|
| `VERCEL_AI_API_KEY` | generate-code, background-generate |
| `OPENROUTER_API_KEY` | visual-edits |
| `MODAL_API_URL` | modal-proxy |
| `PAYPAL_CLIENT_ID` / `PAYPAL_SECRET` | paypal-create-order, paypal-capture-order |

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
| AI | Gemini (via Vercel AI Gateway), OpenRouter |
| Code Editor | Monaco Editor |
| Sandbox | Modal (containerized preview) |
| Payments | PayPal |
| Deployment | Vercel, GitHub |

---

## 📄 License

Proprietary — All rights reserved.
