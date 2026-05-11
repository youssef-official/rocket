
# خطة التحويل لنسخة Open Source محلية

## الهدف
تحويل المشروع من معتمد على Supabase إلى **محلي بالكامل** يعمل بدون قاعدة بيانات، جاهز للنشر على GitHub.

---

## 1. الحذف الكامل (Removal)

### مجلدات/ملفات تُحذف بالكامل:
- `supabase/` (كل الـ functions والـ migrations والـ config)
- `src/integrations/supabase/` (client + types)
- `src/integrations/lovable/`
- `src/services/creditService.ts`, `emailService.ts`, `paypalService.ts`, `versionNameService.ts`, `visualEditService.ts`
- `src/contexts/AuthContext.tsx`
- `src/components/auth/`
- `src/pages/Admin.tsx`, `Pricing.tsx`, `Billing.tsx`, `Docs.tsx`, `SupabaseConnect.tsx`, `SupabaseCallback.tsx`, `AiForAll.tsx`, `Blog.tsx`, `BlogPost.tsx`, `FAQ.tsx`, `AboutUs.tsx`, `Privacy.tsx`, `Terms.tsx`, `GetStarted.tsx`, `NewVibeTool.tsx`
- `src/components/admin/`
- `src/components/pricing/`
- `src/components/editor/DatabasePanel.tsx`, `AnalyticsPanel.tsx`, `GitHubPushDialog.tsx`, `IntegrationDialogs.tsx`
- `src/hooks/useAutoMigration.ts`, `useUserPlan.ts`, `useIntegrations.ts`
- `src/lib/plans.ts`
- `backend/` (Modal backend)
- `public/analyzer.js`, `public/branding.js`

### تنظيف داخل ملفات:
- إزالة كل `import { supabase } from "@/integrations/supabase/client"`
- إزالة كل استدعاءات `supabase.functions.invoke`, `.from()`, `.auth`, etc.
- إزالة الإشارات إلى credits/plans/analytics في `EditorLayout.tsx`, `ChatView.tsx`, `HomePage.tsx`, `UserMenuDropdown.tsx`, `App.tsx`
- إزالة قسم Database و Analytics من tabs المحرر

---

## 2. تخزين محلي (Local Storage layer)

إنشاء `src/services/localStore.ts` يستبدل Supabase بـ `localStorage`:
- `projects` (CRUD)
- `chat_messages` per project
- `project_versions` per project
- `ai_settings` (provider, model, apiKey, baseUrl)

إنشاء `src/services/aiClient.ts` موحّد يستبدل `directAiService.ts`:
- يقرأ الإعدادات من localStorage
- يدعم: OpenAI, Anthropic, Google Gemini, OpenRouter, Custom (URL + key)
- streaming SSE chat completions API standard
- لا توجد credits ولا quotas

---

## 3. إعدادات AI (Settings Modal جديد)

في `UserMenuDropdown` → زر "AI Settings" يفتح modal فيه:
- **Provider preset**: OpenAI / Anthropic / Google Gemini / OpenRouter / Custom
- **Model**: قائمة جاهزة لكل provider + خيار كتابة يدوي
- **API Key**: input
- **Base URL**: input (يتعبّى تلقائياً حسب الـ preset، قابل للتعديل)
- زر Save → يحفظ في localStorage

إزالة من المنيو: Billing, Wallpaper Music (نخليها), Credits banner, Upgrade button.

---

## 4. زر اختيار الموديل في مربع الإدخال (Home)

في `HomePage.tsx` بجوار مربع الإدخال:
- إضافة زر صغير (نفس ستايل الأزرار الحالية: Voice, Theme) باسم "Model"
- يفتح dropdown بسيط فيه قائمة الموديلات المتاحة من الـ provider المختار
- اختيار سريع بدون فتح Settings
- **لا يغيّر أي شيء في التصميم** — نفس الـ glass style وnفس الـ spacing

---

## 5. Auth محلي (no-op)

`AuthContext` يصبح stub يرجّع user افتراضي محلي (`{ id: 'local-user', displayName: 'Local User' }`) محفوظ في localStorage مع إمكانية تعديل الاسم من Settings.

إزالة كل صفحات Auth والـ protected routes — كل شيء متاح مباشرة.

---

## 6. تنظيف Routes (App.tsx)

الإبقاء فقط على:
- `/` → HomePage
- `/projects/:id` → ProjectView (Editor)
- `/settings` → Settings (محلي)
- `*` → NotFound

حذف كل الراوتات الباقية.

---

## 7. تنظيف package.json
حذف الـ deps غير المستخدمة بعد التنظيف: `@supabase/supabase-js`, `@paypal/*`, إلخ.

---

## التزام صارم
- **لا تغيير في التصميم** — نفس الألوان، الخطوط، الـ spacing، الـ glass effects.
- نفس الـ UX في chat و generation — فقط مصدر البيانات يتغير.

## Technical notes
- `localStorage` keys بـ prefix `vivora_` لتجنب التصادم.
- الـ generation الحالي يستخدم edge function `generate-code` — نقله لـ frontend يعني نقل الـ system prompt الكبير لـ `src/prompts/systemPrompt.ts` ونستدعي الـ AI provider مباشرة من المتصفح (مع تحذير CORS — معظم الـ providers يدعمون CORS؛ في حالة Anthropic نوصي بـ OpenRouter كـ proxy).
- versions و chat history تتحفظ في localStorage تحت حجم المتصفح (~5-10MB) — للمشاريع الكبيرة نضيف export/import JSON.

## ملاحظة مهمة
ده تغيير ضخم جداً (حذف ~40 ملف + إعادة بناء طبقة البيانات). هل تريد أن أبدأ التنفيذ على دفعات؟ مقترح:
- **دفعة 1**: حذف Supabase + إنشاء localStore + auth stub + تنظيف routes
- **دفعة 2**: AI Settings modal + aiClient الموحد + استبدال generate-code
- **دفعة 3**: زر الموديل في الـ Home + تنظيف نهائي للـ panels

أم تفضّل أنفّذ كل شيء في رد واحد كبير؟
