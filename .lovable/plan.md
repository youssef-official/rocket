# خطة التحويل لنسخة محلية (Open Source)

هدف كبير: إزالة كل البنية الخلفية (Supabase, قاعدة بيانات, edge functions, migrations, admin, pricing, docs) وتحويل المشروع لتطبيق React محلي بالكامل يخزن كل شيء في `localStorage`، ويستخدم AI Provider قابل للتخصيص من المستخدم.

---

## 1) الحذف الكامل

### مجلدات/ملفات تُحذف نهائيًا
- `supabase/` (كل المجلد: config.toml, functions/*, migrations/*, .temp)
- `backend/` (main.py, server.py, requirements.txt)
- `src/integrations/supabase/` (كامل)
- `src/integrations/lovable/`
- `src/services/`: `creditService.ts`, `paypalService.ts`, `emailService.ts`, `directAiService.ts`, `aiService.ts`, `versionNameService.ts`, `visualEditService.ts` (سيُعاد بناء aiService محليًا)
- `src/hooks/`: `useUserPlan.ts`, `useAutoMigration.ts`, `useIntegrations.ts`, `useChatMessages.ts`, `useProjects.ts`, `useVersions.ts` (سيُعاد بناء بعضها لتعمل مع localStorage)
- `src/contexts/AuthContext.tsx`
- `src/pages/`: `Admin.tsx`, `Pricing.tsx`, `Billing.tsx`, `Docs.tsx`, `Blog.tsx`, `BlogPost.tsx`, `AboutUs.tsx`, `FAQ.tsx`, `AiForAll.tsx`, `Privacy.tsx`, `Terms.tsx`, `Settings.tsx` (يُعاد بناؤها), `SupabaseConnect.tsx`, `SupabaseCallback.tsx`, `ProjectSettings.tsx`, `GetStarted.tsx`, `NewVibeTool.tsx`
- `src/components/admin/` (كامل)
- `src/components/auth/AuthPage.tsx`
- `src/components/pricing/`
- `src/components/editor/`: `DatabasePanel.tsx`, `AnalyticsPanel.tsx`, `IntegrationDialogs.tsx`, `GitHubPushDialog.tsx`
- `src/components/shared/`: `PayPalButton.tsx`, `UpgradeModal.tsx`, `CreditWarningBanner.tsx`, `MaintenanceScreen.tsx`, `SiteMessagePopup.tsx`, `NotificationInbox.tsx`, `MusicPlayer.tsx` (اختياري)
- `src/lib/plans.ts`
- `public/analyzer.js`, `public/branding.js`
- `.env` references لمتغيرات Supabase

---

## 2) الإضافات الجديدة

### `src/lib/storage.ts`
طبقة تخزين محلية تستبدل Supabase:
- `getProjects()`, `saveProject()`, `deleteProject()`
- `getMessages(projectId)`, `addMessage(...)`
- `getVersions(projectId)`, `saveVersion(...)`
- `getAIConfig()`, `setAIConfig(...)`
كلها في `localStorage` تحت مفاتيح `vivora_*`.

### `src/lib/aiProviders.ts`
قائمة مزودين جاهزين (presets):
- OpenAI (`https://api.openai.com/v1`) — موديلات: gpt-4o, gpt-4o-mini, gpt-5
- Anthropic (`https://api.anthropic.com/v1`) — claude-3-5-sonnet, claude-opus
- Google Gemini (`https://generativelanguage.googleapis.com/v1beta`) — gemini-2.5-flash, gemini-2.5-pro
- Groq (`https://api.groq.com/openai/v1`)
- OpenRouter (`https://openrouter.ai/api/v1`)
- Mistral, DeepSeek, Together
- **Custom**: المستخدم يدخل name + baseURL + apiKey + modelId يدويًا.

### `src/services/localAiService.ts`
يستدعي AI مباشرة من المتصفح باستخدام إعدادات المستخدم (OpenAI-compatible `/chat/completions`). يدعم streaming. **لا يوجد backend** — المفتاح يبقى في localStorage على جهاز المستخدم.

### `src/components/SettingsModal.tsx` (إعادة بناء)
- تبويب "AI Provider": اختيار preset، تعديل baseURL، إدخال API key، اختيار نموذج (textarea للنماذج المخصصة).
- زر "Add custom provider".
- تبويب "Appearance" (theme/language).
يُفتح من **زر Settings في User Menu Dropdown**.

### `src/components/shared/ModelSelector.tsx`
زر اختيار الموديل في مربع الإدخال بالصفحة الرئيسية — يعرض dropdown بالموديلات المعرّفة في إعدادات المستخدم.

---

## 3) تعديلات

- `src/App.tsx`: إزالة AuthProvider, BrowserRouter routes للصفحات المحذوفة. الإبقاء فقط على: `/` (HomePage), `/project/:id` (Editor).
- `src/pages/Index.tsx` / `HomePage.tsx`: إزالة كل اشارات auth/credits/upgrade. إضافة `<ModelSelector>` بجانب مربع الإدخال.
- `src/components/editor/EditorLayout.tsx`: إزالة DatabasePanel + AnalyticsPanel + Integrations. الاحتفاء بـ ChatView, CodeView, PreviewView فقط.
- `src/components/shared/UserMenuDropdown.tsx`: إزالة كل ما يتعلق بـ auth/billing/admin. إبقاء زر **Settings** فقط (يفتح SettingsModal).
- `src/components/editor/ChatView.tsx`: استبدال `directAiService` بـ `localAiService`، إزالة credit deduction.
- `index.html`: إزالة سكريبتات analyzer/branding.
- `package.json`: إزالة `@supabase/supabase-js`, `@paypal/*`, `aws-sdk`, إلخ.
- `vite.config.ts`: إزالة `lovable-tagger` (اختياري للـ open source).
- `README.md`: تحديث للتعليمات المحلية (`npm install && npm run dev`).

---

## 4) الـ Routes النهائية

```
/                → HomePage (مع ModelSelector)
/project/:id     → EditorLayout (Chat + Code + Preview)
/settings        → (اختياري) أو فقط modal
*                → NotFound
```

---

## أسئلة قبل التنفيذ

1. **المحرر (Editor)**: هل تريد الإبقاء على نظام التوليد الفعلي للمشاريع (يستدعي AI لإنشاء كود ويعرضه)، أم نسخة بسيطة Chat فقط بدون code generation؟ الحالي معقد ومرتبط بـ Modal sandbox خارجي.
2. **Modal Sandbox**: هل أحذف أيضًا الاتصال بـ Modal API (`MODAL_API_URL`) المستخدم لتشغيل sandbox preview؟ لو نعم فسيختفي preview الحي ويبقى عرض الكود فقط.
3. **MusicPlayer / Celebrations / Theme system**: أحذفهم أم أحتفظ بهم؟
4. **Versions/Project history**: أخزنهم في localStorage (محدود ~5MB) أم أحذف ميزة الإصدارات تمامًا؟

أجب على هذه الأسئلة وسأبدأ التنفيذ مباشرة.
