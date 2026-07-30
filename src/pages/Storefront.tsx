/**
 * THESIS: A product runway where the catalog leads and ecommerce chrome recedes.
 * OWN-WORLD: Customer-selected paper, ink and accent tokens; editorial typography; sharp product imagery.
 * STORY: Discover the collection, add with confidence, and finish a cash-on-delivery order without detours.
 * FIRST VIEWPORT: Brand masthead, one decisive product image field, compact promise, and direct collection entry.
 * FORM: Product runway storefront, paired with the Storefront Studio operating surface; seed 204fe6c1.
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Check, Instagram, Facebook, MessageCircle, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { storeApi } from '@/services/storeService';
import type { Store, StoreOrder, StoreProduct } from '@/types/store';
import './Storefront.css';

type CartLine = { product: StoreProduct; quantity: number };

export default function Storefront() {
  const { slug = '' } = useParams();
  const [store, setStore] = useState<Store | null>(null);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('الكل');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [completed, setCompleted] = useState<StoreOrder | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`vivora_cart_${slug}`);
    if (saved) { try { setCart(JSON.parse(saved)); } catch { /* ignore an old cart */ } }
    storeApi.publicGet(slug).then(setStore).catch(err => setError((err as Error).message));
  }, [slug]);
  useEffect(() => { localStorage.setItem(`vivora_cart_${slug}`, JSON.stringify(cart)); }, [cart, slug]);

  const products = store?.products || [];
  const categories = ['الكل', ...new Set(products.map(item => item.category))];
  const visible = category === 'الكل' ? products : products.filter(item => item.category === category);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const featured = products.find(item => item.featured) || products[0];
  const currency = store?.config.currency || 'EGP';
  const formatPrice = (value: number) => new Intl.NumberFormat(store?.config.locale || 'ar-EG', { style:'currency', currency }).format(value);

  const add = (product: StoreProduct) => {
    setCart(current => current.some(line => line.product.id === product.id)
      ? current.map(line => line.product.id === product.id ? { ...line, quantity:Math.min(product.stock, line.quantity + 1) } : line)
      : [...current, { product, quantity:1 }]);
    setCartOpen(true);
  };
  const changeQuantity = (productId: string, delta: number) => setCart(current => current.map(line => line.product.id === productId ? { ...line, quantity:Math.max(0, Math.min(line.product.stock, line.quantity + delta)) } : line).filter(line => line.quantity > 0));

  if (error) return <div className="shop-state"><h1>المتجر غير متاح</h1><p>{error}</p><a href="/">العودة إلى Vivora X</a></div>;
  if (!store) return <div className="shop-state"><span className="shop-loader" /><p>بنجهز واجهة المتجر…</p></div>;

  const vars = { '--shop-ink':store.config.colors.ink, '--shop-paper':store.config.colors.paper, '--shop-accent':store.config.colors.accent, '--shop-muted':store.config.colors.muted, '--shop-display':store.config.typography.display, '--shop-body':store.config.typography.body } as React.CSSProperties;
  return (
    <main className="shop" dir={store.config.direction} style={vars}>
      <div className="shop-announcement">{store.config.announcement}</div>
      <header className="shop-nav">
        <a href={`/shop/${store.slug}`} className="shop-brand">{store.name}</a>
        <nav aria-label="التنقل الرئيسي"><a href="#collection">المجموعة</a><a href="#story">عن المتجر</a><a href="#contact">تواصل</a></nav>
        <button className="shop-cart-button" onClick={() => setCartOpen(true)} aria-label={`السلة، ${count} منتجات`}><ShoppingBag size={18} /><span>{count}</span></button>
      </header>

      <section className="shop-hero">
        <div className="shop-hero-copy">
          <p className="shop-edition">{store.config.style}</p>
          <h1>{store.config.hero.title}</h1>
          <p>{store.config.hero.subtitle}</p>
          <a href="#collection">{store.config.hero.cta}<ArrowLeft size={18} /></a>
        </div>
        <div className="shop-hero-image">
          {featured?.imageUrl ? <img src={featured.imageUrl} alt={featured.name} /> : <div className="shop-image-fallback">{store.name.slice(0, 1)}</div>}
          {featured && <div className="shop-hero-product"><span>اختيار المتجر</span><strong>{featured.name}</strong><button onClick={() => add(featured)}>أضف للسلة</button></div>}
        </div>
      </section>

      <section className="shop-collection" id="collection">
        <div className="shop-section-head"><div><p>الكتالوج</p><h2>اختيارات صُممت ليُعاد إليها</h2></div><span>{products.length} منتج</span></div>
        <div className="shop-categories">{categories.map(item => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <div className="shop-products">
          {visible.map((product, index) => <article className="shop-product" key={product.id}>
            <div className="shop-product-image">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} loading={index > 3 ? 'lazy' : 'eager'} /> : <div className="shop-image-fallback">{product.name.slice(0,1)}</div>}{product.compareAtPrice && <span>عرض</span>}<button onClick={() => add(product)} disabled={product.stock < 1}>{product.stock < 1 ? 'نفد' : <><Plus size={16} /> أضف</>}</button></div>
            <div className="shop-product-meta"><div><p>{product.category}</p><h3>{product.name}</h3></div><div className="shop-price"><strong>{formatPrice(product.price)}</strong>{product.compareAtPrice && <del>{formatPrice(product.compareAtPrice)}</del>}</div></div>
          </article>)}
        </div>
      </section>

      <section className="shop-story" id="story"><p>من الفكرة إلى باب بيتك</p><h2>واجهة جميلة، طلب واضح، ومنتجاتك في مكانها الصحيح.</h2><div><span>اختيارات واضحة</span><span>دفع عند الاستلام</span><span>متابعة مباشرة للطلب</span></div></section>
      <footer className="shop-footer" id="contact"><div><strong>{store.name}</strong><p>{store.config.hero.subtitle}</p></div><div className="shop-social">{store.social.instagram && <a href={store.social.instagram} aria-label="Instagram"><Instagram /></a>}{store.social.facebook && <a href={store.social.facebook} aria-label="Facebook"><Facebook /></a>}{store.social.whatsapp && <a href={`https://wa.me/${store.social.whatsapp.replace(/\D/g,'')}`} aria-label="WhatsApp"><MessageCircle /></a>}</div><a href={`/stores/${store.id}/admin`} className="shop-admin-link">إدارة المتجر</a></footer>

      {cartOpen && <div className="shop-drawer-shell" role="dialog" aria-modal="true" aria-label="سلة المشتريات"><button className="shop-drawer-backdrop" onClick={() => setCartOpen(false)} aria-label="إغلاق السلة" /><aside className="shop-drawer"><header><div><p>سلة المشتريات</p><strong>{count} قطع</strong></div><button onClick={() => setCartOpen(false)}><X /></button></header><div className="shop-cart-lines">{cart.length ? cart.map(line => <div className="shop-cart-line" key={line.product.id}><img src={line.product.imageUrl} alt="" /><div><strong>{line.product.name}</strong><span>{formatPrice(line.product.price)}</span><div className="shop-quantity"><button onClick={() => changeQuantity(line.product.id,-1)}><Minus /></button><span>{line.quantity}</span><button onClick={() => changeQuantity(line.product.id,1)}><Plus /></button></div></div><button className="shop-remove" onClick={() => setCart(current => current.filter(item => item.product.id !== line.product.id))}><Trash2 /></button></div>) : <div className="shop-empty-cart"><ShoppingBag /><h3>السلة لسه فاضية</h3><p>اختار أول منتج، وهتلاقيه هنا.</p></div>}</div><footer><div><span>الإجمالي</span><strong>{formatPrice(total)}</strong></div><button disabled={!cart.length} onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>إتمام الطلب</button></footer></aside></div>}
      {checkoutOpen && <Checkout store={store} cart={cart} total={total} placing={placing} completed={completed} formatPrice={formatPrice} onClose={() => setCheckoutOpen(false)} onSubmit={async payload => { setPlacing(true); try { const order = await storeApi.checkout(store.slug, { ...payload, items:cart.map(line => ({ productId:line.product.id, quantity:line.quantity })) }); setCompleted(order); setCart([]); } finally { setPlacing(false); } }} />}
    </main>
  );
}

function Checkout({ store, cart, total, placing, completed, formatPrice, onClose, onSubmit }: { store:Store; cart:CartLine[]; total:number; placing:boolean; completed:StoreOrder|null; formatPrice:(value:number)=>string; onClose:()=>void; onSubmit:(payload:Record<string,string>)=>Promise<void> }) {
  const [form, setForm] = useState({ customerName:'', phone:'', email:'', address:'', city:'', notes:'' });
  const [error, setError] = useState('');
  const set = (key:string, value:string) => setForm(current => ({ ...current, [key]:value }));
  if (completed) return <div className="shop-checkout-shell"><button className="shop-drawer-backdrop" onClick={onClose} /><section className="shop-checkout shop-checkout-done"><span><Check /></span><p>تم تسجيل طلبك</p><h2>{completed.orderNumber}</h2><p>هنراجع الطلب ونتواصل معاك على الرقم المسجل.</p><button onClick={onClose}>العودة للمتجر</button></section></div>;
  return <div className="shop-checkout-shell"><button className="shop-drawer-backdrop" onClick={onClose} /><section className="shop-checkout" role="dialog" aria-modal="true"><header><div><p>{store.name}</p><h2>فين نوصّل طلبك؟</h2></div><button onClick={onClose}><X /></button></header><form onSubmit={async event => { event.preventDefault(); setError(''); try { await onSubmit(form); } catch (err) { setError((err as Error).message); } }}><div className="shop-checkout-grid"><label>الاسم الكامل<input required value={form.customerName} onChange={e=>set('customerName',e.target.value)} /></label><label>رقم الهاتف<input required value={form.phone} onChange={e=>set('phone',e.target.value)} /></label><label>المدينة<input required value={form.city} onChange={e=>set('city',e.target.value)} /></label><label>البريد الإلكتروني<input type="email" value={form.email} onChange={e=>set('email',e.target.value)} /></label><label className="wide">العنوان بالتفصيل<textarea required value={form.address} onChange={e=>set('address',e.target.value)} /></label><label className="wide">ملاحظات للطلب<textarea value={form.notes} onChange={e=>set('notes',e.target.value)} /></label></div>{error && <p className="shop-form-error">{error}</p>}<footer><div><span>{cart.length} منتجات</span><strong>{formatPrice(total)}</strong></div><button disabled={placing}>{placing ? 'جارٍ تسجيل الطلب…' : 'تأكيد الطلب والدفع عند الاستلام'}</button></footer></form></section></div>;
}
