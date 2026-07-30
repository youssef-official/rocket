import { useEffect, useState } from 'react';
import { ExternalLink, Plus, Settings2, ShoppingBag } from 'lucide-react';
import { VivoraLogo } from '@/components/shared/VivoraLogo';
import { storeApi } from '@/services/storeService';
import type { Store } from '@/types/store';

export default function StoreHub() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    storeApi.list().then(setStores).catch(err => setError((err as Error).message)).finally(() => setLoading(false));
  }, []);

  return (
    <main dir="rtl" className="min-h-screen bg-[#070b16] px-4 py-6 text-slate-100 md:px-10">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <a href="/"><VivoraLogo size="sm" /></a>
        <a href="/" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-pink-500 px-4 text-sm font-bold text-white"><Plus size={16} />متجر جديد</a>
      </header>
      <section className="mx-auto mt-20 max-w-6xl">
        <p className="text-sm font-bold text-pink-300">محرك التجارة</p>
        <h1 className="mt-3 font-['Sora'] text-4xl font-bold tracking-[-.03em] md:text-6xl">متاجرك في مكان واحد.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">افتح لوحة التشغيل، راقب الطلبات، أو شاهد المتجر كما يراه العميل.</p>
        {loading ? <p className="mt-16 text-slate-500">جارٍ تحميل المتاجر…</p> : error ? <p className="mt-16 text-rose-300">{error}</p> : stores.length ? (
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {stores.map(store => (
              <article key={store.id} className="overflow-hidden rounded-2xl border border-white/[.08] bg-[#0d1426]">
                <div className="h-2" style={{ background:store.config.colors.accent }} />
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div><span className="text-xs text-slate-500">/{store.slug}</span><h2 className="mt-2 text-2xl font-bold">{store.name}</h2></div>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">{store.status === 'published' ? 'متاح' : 'مسودة'}</span>
                  </div>
                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-400">{store.config.hero.subtitle}</p>
                  <div className="mt-8 flex gap-2">
                    <a href={`/stores/${store.id}/admin`} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-pink-500 text-xs font-bold text-white"><Settings2 size={15} />إدارة المتجر</a>
                    <a href={`/shop/${store.slug}`} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-xs font-bold text-slate-300"><ExternalLink size={14} />فتح</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-12 grid min-h-72 place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[.02] text-center">
            <div><ShoppingBag className="mx-auto text-pink-300" /><h2 className="mt-4 text-xl font-bold">ابدأ أول متجر</h2><p className="mt-2 text-sm text-slate-500">ارجع للرئيسية واختار “متجر إلكتروني”.</p></div>
          </div>
        )}
      </section>
    </main>
  );
}
