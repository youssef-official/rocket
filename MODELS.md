# 🤖 Rocket AI Models

## نماذج Rok AI المتاحة

هذا الملف يحتوي على جميع نماذج الذكاء الاصطناعي المستخدمة في منصة Rocket.

---

## 📊 جدول النماذج

| الاسم المعروض | الاسم الحقيقي (API) | الوصف | السرعة | الجودة | الخطة المطلوبة | المُضاعف |
|---------------|---------------------|-------|--------|--------|----------------|----------|
| 🤖 **Rok-Fast** | `google/gemini-2.0-flash` | Quick edits | ⚡⚡⚡⚡⚡ (5/5) | ⭐⭐ (2/6) | Spark (Free) | 1x |
| 🧠 **Rok-Smart** | `xai/grok-4.1-fast-reasoning` | Stable coding | ⚡⚡⚡⚡ (4/5) | ⭐⭐⭐ (3/6) | Spark (Free) | 1.3x |
| ⚡ **Rok-Turbo** | `google/gemini-3-flash` | Production apps | ⚡⚡⚡ (3/5) | ⭐⭐⭐⭐ (4/6) | Builder ($8/mo) | 2.2x |
| 👑 **Rok-Ultra** | `anthropic/claude-haiku-4.5` | Smart logic | ⚡⚡ (2/5) | ⭐⭐⭐⭐⭐ (5/6) | Creator ($19/mo) | 3x |
| 🧠 **Rok-Reson** | `anthropic/claude-opus-4.5` | Deep systems | ⚡ (1/5) | ⭐⭐⭐⭐⭐⭐ (6/6) | Scale ($49/mo) | 4x |

---

## 📝 تفاصيل كل نموذج

### 1. Rok-Fast 🤖
- **ID:** `rok-fast`
- **Real Model:** `google/gemini-2.0-flash`
- **Description:** Quick edits - سريع جداً للتعديلات البسيطة
- **Speed:** 5/5 ⚡⚡⚡⚡⚡
- **Quality:** 2/6 ⭐⭐
- **Min Plan:** Spark (Free)
- **Credit Multiplier:** 1x

---

### 2. Rok-Smart 🧠
- **ID:** `rok-smart`
- **Real Model:** `xai/grok-4.1-fast-reasoning`
- **Description:** Stable coding - كتابة كود مستقر
- **Speed:** 4/5 ⚡⚡⚡⚡
- **Quality:** 3/6 ⭐⭐⭐
- **Min Plan:** Spark (Free)
- **Credit Multiplier:** 1.3x

---

### 3. Rok-Turbo ⚡
- **ID:** `rok-turbo`
- **Real Model:** `google/gemini-3-flash`
- **Description:** Production apps - تطبيقات إنتاجية
- **Speed:** 3/5 ⚡⚡⚡
- **Quality:** 4/6 ⭐⭐⭐⭐
- **Min Plan:** Builder ($8/month)
- **Credit Multiplier:** 2.2x

---

### 4. Rok-Ultra 👑
- **ID:** `rok-ultra`
- **Real Model:** `anthropic/claude-haiku-4.5`
- **Description:** Smart logic - منطق ذكي ومتقدم
- **Speed:** 2/5 ⚡⚡
- **Quality:** 5/6 ⭐⭐⭐⭐⭐
- **Min Plan:** Creator ($19/month)
- **Credit Multiplier:** 3x

---

### 5. Rok-Reson 🧠
- **ID:** `rok-reson`
- **Real Model:** `anthropic/claude-opus-4.5`
- **Description:** Deep systems - أنظمة عميقة ومعقدة
- **Speed:** 1/5 ⚡
- **Quality:** 6/6 ⭐⭐⭐⭐⭐⭐
- **Min Plan:** Scale ($49/month)
- **Credit Multiplier:** 4x

---

## 💰 خطط الاشتراك والنماذج المتاحة

| الخطة | السعر | النقاط اليومية | النقاط الشهرية | النماذج المتاحة |
|------|------|----------------|----------------|----------------|
| **Spark** | مجاني | 5 نقاط | 0 | Rok-Fast, Rok-Smart |
| **Builder** | $8/شهر | 5 نقاط | +100 نقطة | Rok-Fast, Rok-Smart, Rok-Turbo |
| **Creator** | $19/شهر | 5 نقاط | +300 نقطة | Rok-Fast, Rok-Smart, Rok-Turbo, Rok-Ultra |
| **Scale** | $49/شهر | 5 نقاط | +700 نقطة | جميع النماذج |

---

## 💳 نظام الكريدت الذكي

### كيف يتم حساب الكريدت؟

الكريدت يُحسب بناءً على **حجم العمل الفعلي**، وليس وصف المستخدم.

| نوع العمل | الوصف | الكريدت المتوقع |
|-----------|-------|-----------------|
| Small edit | تغيير لون، نص | ~0.4 |
| Section edit | إزالة قسم، تعديل header | ~0.8 |
| Login system | نظام تسجيل دخول | ~1.3 |
| Full layout | صفحة هبوط كاملة | ~2.0 |
| Admin panel | لوحة تحكم كاملة | ~4.0 |

**ملاحظة:** حتى لو كتب المستخدم "This is a small edit" في البرومت، النظام يحسب الكريدت بناءً على الملفات المُعدّلة وأسطر الكود، وليس وصف المستخدم.

---

## 🔧 الكود المرجعي

```typescript
export const ROK_MODELS: RokModel[] = [
  {
    id: 'rok-fast',
    name: 'Rok-Fast',
    realModel: 'google/gemini-2.0-flash',
    description: 'Quick edits',
    speed: 5,
    quality: 2,
    multiplier: 1,
    minPlan: 'spark',
    icon: '🤖'
  },
  {
    id: 'rok-smart',
    name: 'Rok-Smart',
    realModel: 'xai/grok-4.1-fast-reasoning',
    description: 'Stable coding',
    speed: 4,
    quality: 3,
    multiplier: 1.3,
    minPlan: 'spark',
    icon: '🧠'
  },
  {
    id: 'rok-turbo',
    name: 'Rok-Turbo',
    realModel: 'google/gemini-3-flash',
    description: 'Production apps',
    speed: 3,
    quality: 4,
    multiplier: 2.2,
    minPlan: 'builder',
    icon: '⚡'
  },
  {
    id: 'rok-ultra',
    name: 'Rok-Ultra',
    realModel: 'anthropic/claude-haiku-4.5',
    description: 'Smart logic',
    speed: 2,
    quality: 5,
    multiplier: 3,
    minPlan: 'creator',
    icon: '👑'
  },
  {
    id: 'rok-reson',
    name: 'Rok-Reson',
    realModel: 'anthropic/claude-opus-4.5',
    description: 'Deep systems',
    speed: 1,
    quality: 6,
    multiplier: 4,
    minPlan: 'scale',
    icon: '🧠'
  }
];
```

---

## 📍 موقع الملف في المشروع

الموديلات معرفة في:
```
src/hooks/useUserPlan.ts
```

---

*آخر تحديث: يناير 2026*
