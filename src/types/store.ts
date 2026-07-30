export type StoreColors = { ink: string; paper: string; accent: string; muted: string };
export type StoreConfig = {
  direction: 'rtl' | 'ltr'; currency: string; locale: string; style: string;
  colors: StoreColors;
  typography: { display: string; body: string };
  hero: { title: string; subtitle: string; cta: string };
  announcement: string; categories: string[];
};
export type StoreSocial = { instagram?: string; facebook?: string; tiktok?: string; whatsapp?: string };
export type StoreProduct = {
  id: string; storeId: string; name: string; slug: string; description: string;
  price: number; compareAtPrice: number | null; stock: number; imageUrl: string;
  category: string; status: 'active' | 'draft' | 'archived'; featured: boolean;
  createdAt: string; updatedAt: string;
};
export type StoreOrder = {
  id: string; storeId: string; orderNumber: string; customerName: string; phone: string;
  email: string; address: string; city: string; notes: string; subtotal: number; total: number;
  status: 'new' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string; updatedAt: string;
};
export type Store = {
  id: string; ownerUserId: string; name: string; slug: string; prompt: string;
  status: 'draft' | 'published' | 'paused'; config: StoreConfig; social: StoreSocial;
  createdAt: string; updatedAt: string; products?: StoreProduct[]; orders?: StoreOrder[];
};
export type StoreBlueprint = { name: string; config: StoreConfig; social: StoreSocial };
