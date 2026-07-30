import { api } from '@/services/api';
import { callingDirectAI } from '@/services/directAiService';
import { readSSEStream } from '@/services/aiService';
import type { Store, StoreBlueprint, StoreProduct, StoreOrder } from '@/types/store';

const fallbackBlueprint = (prompt: string, theme?: { name: string; colors: string[] } | null): StoreBlueprint => ({
  name: prompt.trim().split(/[،,.\n]/)[0].slice(0, 42) || 'متجري الجديد',
  config: {
    direction: /[\u0600-\u06ff]/.test(prompt) ? 'rtl' : 'ltr', currency: 'EGP', locale: /[\u0600-\u06ff]/.test(prompt) ? 'ar-EG' : 'en-US', style: 'editorial product gallery',
    colors: { ink:theme?.colors[0] || '#11131a', paper:theme?.colors[2] || '#f5f2ec', accent:theme?.colors[1] || '#ec4899', muted:'#777267' },
    typography: { display:'Sora', body:'Manrope' },
    hero: { title:'اختيارات صنعت لتبقى', subtitle:'منتجات مختارة وتجربة شراء واضحة من أول نظرة حتى وصول الطلب.', cta:'تسوّق المجموعة' },
    announcement:'شحن مجاني للطلبات المختارة', categories:['الجديد','الأكثر طلبًا','مختاراتنا'],
  },
  social: {},
});

const asRecord = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const safeText = (value: unknown, fallback: string, max: number) => typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : fallback;
const safeHex = (value: unknown, fallback: string) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;

export function normalizeStoreBlueprint(value: unknown, prompt: string, theme?: { name: string; colors: string[] } | null): StoreBlueprint {
  const fallback = fallbackBlueprint(prompt, theme);
  const root = asRecord(value);
  const config = asRecord(root.config);
  const colors = asRecord(config.colors);
  const typography = asRecord(config.typography);
  const hero = asRecord(config.hero);
  const social = asRecord(root.social);
  const categories = Array.isArray(config.categories)
    ? config.categories.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).slice(0, 8).map(item => item.trim().slice(0, 50))
    : [];

  return {
    name: safeText(root.name, fallback.name, 80),
    config: {
      direction: config.direction === 'ltr' || config.direction === 'rtl' ? config.direction : fallback.config.direction,
      currency: safeText(config.currency, fallback.config.currency, 8),
      locale: safeText(config.locale, fallback.config.locale, 12),
      style: safeText(config.style, fallback.config.style, 40),
      colors: {
        ink: safeHex(colors.ink, fallback.config.colors.ink),
        paper: safeHex(colors.paper, fallback.config.colors.paper),
        accent: safeHex(colors.accent, fallback.config.colors.accent),
        muted: safeHex(colors.muted, fallback.config.colors.muted),
      },
      typography: {
        display: safeText(typography.display, fallback.config.typography.display, 60),
        body: safeText(typography.body, fallback.config.typography.body, 60),
      },
      hero: {
        title: safeText(hero.title, fallback.config.hero.title, 140),
        subtitle: safeText(hero.subtitle, fallback.config.hero.subtitle, 260),
        cta: safeText(hero.cta, fallback.config.hero.cta, 40),
      },
      announcement: safeText(config.announcement, fallback.config.announcement, 120),
      categories: categories.length ? categories : fallback.config.categories,
    },
    social: {
      instagram: safeText(social.instagram, '', 300),
      facebook: safeText(social.facebook, '', 300),
      tiktok: safeText(social.tiktok, '', 300),
      whatsapp: safeText(social.whatsapp, '', 50),
    },
  };
}

export async function generateStoreBlueprint(prompt: string, language: string, theme?: { name: string; colors: string[] } | null) {
  try {
    const response = await callingDirectAI('store-config', [{ role:'user', content:prompt }], undefined, undefined, language, theme);
    if (!response.ok) return fallbackBlueprint(prompt, theme);
    const { text } = await readSSEStream(response);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return fallbackBlueprint(prompt, theme);
    return normalizeStoreBlueprint(JSON.parse(match[0]), prompt, theme);
  } catch { return fallbackBlueprint(prompt, theme); }
}

export const storeApi = {
  list: () => api<Store[]>('/stores'),
  create: (prompt: string, blueprint: StoreBlueprint) => api<Store>('/stores', { method:'POST', body:JSON.stringify({ prompt, blueprint }) }),
  get: (id: string) => api<Store>(`/stores/${id}`),
  update: (id: string, changes: Partial<Pick<Store,'name'|'status'|'config'|'social'>>) => api<Store>(`/stores/${id}`, { method:'PATCH', body:JSON.stringify(changes) }),
  createProduct: (id: string, product: Partial<StoreProduct>) => api<StoreProduct>(`/stores/${id}/products`, { method:'POST', body:JSON.stringify(product) }),
  updateProduct: (id: string, productId: string, changes: Partial<StoreProduct>) => api<StoreProduct>(`/stores/${id}/products/${productId}`, { method:'PATCH', body:JSON.stringify(changes) }),
  deleteProduct: (id: string, productId: string) => api<void>(`/stores/${id}/products/${productId}`, { method:'DELETE' }),
  updateOrder: (id: string, orderId: string, status: StoreOrder['status']) => api<StoreOrder>(`/stores/${id}/orders/${orderId}`, { method:'PATCH', body:JSON.stringify({ status }) }),
  publicGet: (slug: string) => api<Store>(`/public/stores/${slug}`),
  checkout: (slug: string, payload: unknown) => api<StoreOrder>(`/public/stores/${slug}/orders`, { method:'POST', body:JSON.stringify(payload) }),
};
