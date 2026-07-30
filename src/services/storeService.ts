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

export async function generateStoreBlueprint(prompt: string, language: string, theme?: { name: string; colors: string[] } | null) {
  try {
    const response = await callingDirectAI('store-config', [{ role:'user', content:prompt }], undefined, undefined, language, theme);
    if (!response.ok) return fallbackBlueprint(prompt, theme);
    const { text } = await readSSEStream(response);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return fallbackBlueprint(prompt, theme);
    return JSON.parse(match[0]) as StoreBlueprint;
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
