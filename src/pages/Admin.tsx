/**
 * THESIS: A live operations ledger for Vivora X, not a generic card dashboard.
 * OWN-WORLD: Ink-black and deep navy surfaces, crisp dividers, pink command states, emerald health states.
 * STORY: The administrator scans platform health, acts on accounts, controls celebrations, and protects backups.
 * FIRST VIEWPORT: Persistent command rail, compact status header, then one dense operational surface at a time.
 * FORM: Control-room ledger; task-first navigation and high-density tables in the established Vivora X world.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Archive,
  ArrowUpLeft,
  BadgeCheck,
  BellRing,
  CalendarClock,
  Check,
  Database,
  HardDrive,
  LayoutDashboard,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { VivoraLogo } from '@/components/shared/VivoraLogo';
import { api } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import './Admin.css';

type Plan = 'free' | 'pro' | 'business';
type Tab = 'overview' | 'users' | 'seasonal' | 'backups';
type AdminUser = {
  id: string;
  email: string;
  display_name: string;
  phone?: string;
  role: 'user' | 'admin';
  plan: Plan;
  daily_credits: number;
  credits_used_today: number;
  monthly_credits: number;
  monthly_credits_used: number;
  subscription_expires_at: string | null;
  project_count: number;
};
type Overview = {
  stats: { users: number; projects: number; activePlans: number; backups: number };
  users: AdminUser[];
  expiringUsers: AdminUser[];
};
type Celebration = { name: 'ramadan' | 'eid'; isActive: boolean; config: Record<string, unknown>; updatedAt: string };
type Backup = { id: string; kind: string; filename: string; created_at: string };
type Schedule = { hourly: string; daily: string; weekly: string; retention: number };

const planTone: Record<Plan, string> = {
  free: 'bg-white/[0.06] text-slate-300',
  pro: 'bg-pink-500/15 text-pink-200',
  business: 'bg-emerald-500/15 text-emerald-200',
};

const dateLabel = (date: string | null) => date
  ? new Date(date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
  : 'غير محدد';

const navItems: Array<[Tab, string, typeof LayoutDashboard]> = [
  ['overview', 'نظرة عامة', LayoutDashboard],
  ['users', 'المستخدمون', Users],
  ['seasonal', 'الاحتفالات', BellRing],
  ['backups', 'النسخ الاحتياطية', HardDrive],
];

export const AdminPanel = () => {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [seasons, setSeasons] = useState<Celebration[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async (announce = false) => {
    try {
      setLoading(true);
      const [nextOverview, nextSeasons, nextBackups, nextSchedule] = await Promise.all([
        api<Overview>('/admin/overview'),
        api<Celebration[]>('/admin/celebrations'),
        api<Backup[]>('/admin/backups'),
        api<Schedule>('/admin/backup-schedule'),
      ]);
      setOverview(nextOverview);
      setSeasons(nextSeasons);
      setBackups(nextBackups);
      setSchedule(nextSchedule);
      setError('');
      if (announce) toast({ title: 'تم تحديث لوحة التحكم', description: 'ظهرت أحدث بيانات المنصّة.' });
    } catch (requestError) {
      const message = (requestError as Error).message;
      setError(message);
      if (announce) toast({ variant: 'destructive', title: 'تعذّر التحديث', description: message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') void load();
  }, [user, load]);

  const patchUser = async (target: AdminUser, changes: Record<string, unknown>) => {
    setBusy(target.id);
    try {
      await api(`/admin/users/${target.id}`, { method: 'PATCH', body: JSON.stringify(changes) });
      await load();
      toast({ title: 'تم حفظ الحساب', description: 'تم تحديث الخطة والأرصدة والاشتراك.' });
    } catch (requestError) {
      const message = (requestError as Error).message;
      setError(message);
      toast({ variant: 'destructive', title: 'تعذّر حفظ الحساب', description: message });
    } finally {
      setBusy(null);
    }
  };

  const toggleSeason = async (item: Celebration) => {
    setBusy(item.name);
    try {
      await api(`/admin/celebrations/${item.name}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !item.isActive, config: item.config }),
      });
      window.dispatchEvent(new Event('webo-celebrations-updated'));
      await load();
      toast({ title: 'تم حفظ الإعداد', description: 'تم تحديث حالة الاحتفال.' });
    } catch (requestError) {
      const message = (requestError as Error).message;
      setError(message);
      toast({ variant: 'destructive', title: 'تعذّر حفظ الإعداد', description: message });
    } finally {
      setBusy(null);
    }
  };

  const createBackup = async () => {
    setBusy('backup');
    try {
      await api('/admin/backups', { method: 'POST' });
      await load();
      toast({ title: 'تم إنشاء النسخة', description: 'النسخة الاحتياطية جاهزة للاستعادة.' });
    } catch (requestError) {
      const message = (requestError as Error).message;
      setError(message);
      toast({ variant: 'destructive', title: 'تعذّر إنشاء النسخة', description: message });
    } finally {
      setBusy(null);
    }
  };

  if (authLoading) return <AccessScreen text="جارٍ التحقق من الوصول…" />;
  if (user?.role !== 'admin') return <AccessScreen text="لا تملك صلاحية الوصول إلى لوحة المشرف." />;

  return (
    <main className="admin-shell min-h-screen bg-[#070b16] text-slate-100" dir="rtl">
      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <aside className="sticky top-0 hidden h-screen w-[272px] shrink-0 flex-col border-l border-white/[0.08] bg-[#0b1020] px-4 py-5 md:flex">
          <a href="/" className="flex min-h-12 items-center px-2" aria-label="العودة إلى Vivora X">
            <VivoraLogo size="md" />
          </a>
          <p className="mt-10 px-3 text-[11px] font-semibold text-pink-300">مركز العمليات</p>
          <nav className="mt-3 space-y-1" aria-label="أقسام لوحة المشرف">
            {navItems.map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-right text-sm font-semibold transition ${tab === id ? 'bg-pink-500 text-white shadow-[0_10px_24px_rgba(236,72,153,.22)]' : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'}`}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl bg-[#11182b] p-4">
            <ShieldCheck size={20} className="text-emerald-300" />
            <p className="mt-3 text-sm font-semibold text-white">اتصال محمي</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">الحسابات والنسخ الاحتياطية تعمل عبر خادم Vivora X الخاص.</p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/[0.08] bg-[#070b16]/95 px-4 backdrop-blur-xl md:px-8">
            <div className="md:hidden"><VivoraLogo size="sm" /></div>
            <div className="hidden md:block">
              <p className="text-xs font-semibold text-pink-300">VIVORA X CONTROL ROOM</p>
              <p className="mt-1 text-sm text-slate-400">إدارة الحسابات، الحالات والنسخ الاحتياطية</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                الخادم متصل
              </span>
              <button
                onClick={() => void load(true)}
                disabled={loading}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#0b1020] transition hover:bg-pink-50 disabled:cursor-wait disabled:opacity-60"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                {loading ? 'جارٍ التحديث…' : 'تحديث'}
              </button>
            </div>
          </header>

          <nav className="flex overflow-x-auto border-b border-white/[0.08] bg-[#0b1020] px-3 py-2 md:hidden" aria-label="أقسام لوحة المشرف">
            {navItems.map(([id, label, Icon]) => (
              <button key={id} onClick={() => setTab(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${tab === id ? 'bg-pink-500 text-white' : 'text-slate-400'}`}>
                <Icon size={14} />{label}
              </button>
            ))}
          </nav>

          <section className="p-4 md:p-8 lg:p-10">
            {error && <div role="alert" className="mb-6 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
            {loading && !overview ? (
              <div className="grid min-h-[55vh] place-items-center text-sm text-slate-400">جارٍ تحميل بيانات المنصّة…</div>
            ) : tab === 'overview' ? (
              <OverviewView data={overview} />
            ) : tab === 'users' ? (
              <UsersView users={overview?.users || []} busy={busy} onPatch={patchUser} />
            ) : tab === 'seasonal' ? (
              <SeasonView seasons={seasons} busy={busy} onToggle={toggleSeason} />
            ) : (
              <BackupView backups={backups} schedule={schedule} busy={busy} onCreate={createBackup} />
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

const AccessScreen = ({ text }: { text: string }) => (
  <div className="grid min-h-screen place-items-center bg-[#070b16] p-8 text-center text-slate-200">{text}</div>
);

const PageHeading = ({ label, title, description, action }: { label: string; title: string; description: string; action?: ReactNode }) => (
  <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
    <div>
      <p className="text-sm font-semibold text-pink-300">{label}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-.03em] text-white md:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
    </div>
    {action}
  </div>
);

const OverviewView = ({ data }: { data: Overview | null }) => {
  const expiring = data?.expiringUsers || [];
  const stats = [
    ['المستخدمون', data?.stats.users || 0, Users],
    ['خطط مدفوعة', data?.stats.activePlans || 0, BadgeCheck],
    ['تنتهي خلال 14 يومًا', expiring.length, CalendarClock],
    ['نسخ محفوظة', data?.stats.backups || 0, Archive],
  ] as const;

  return (
    <div>
      <PageHeading label="النظرة التشغيلية" title="لوحة تحكم Vivora X" description="راقب صحة المنصّة والحسابات التي تحتاج تدخلًا من مكان واحد." />
      <section className="admin-overview-grid">
        <div className="admin-command-card">
          <div className="relative z-10 max-w-xl">
            <span className="admin-kicker"><Sparkles size={14} /> حالة المنصّة</span>
            <h2>كل الأنظمة تعمل<br />بصورة طبيعية.</h2>
            <p>الحسابات، المشاريع، وجدولة النسخ الاحتياطية متصلة بالخادم وجاهزة للعمل.</p>
          </div>
          <div className="admin-orbit" aria-hidden="true"><span /><span /><span /></div>
          <div className="admin-health"><span /> مستقرة الآن</div>
        </div>

        <div className="admin-stat-stack">
          {stats.map(([label, value, Icon]) => (
            <article key={label} className="admin-stat-row">
              <span className="admin-stat-icon"><Icon size={17} /></span>
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-ledger mt-6">
        <div className="admin-section-head">
          <div>
            <p className="admin-eyebrow">ATTENTION QUEUE</p>
            <h2>اشتراكات تحتاج متابعة</h2>
            <p>الحسابات المنتهية أو القريبة من الانتهاء.</p>
          </div>
          <span className="rounded-full bg-pink-500/15 px-3 py-1 text-xs font-semibold text-pink-200">{expiring.length}</span>
        </div>
        {expiring.length ? expiring.map(item => (
          <div key={item.id} className="admin-ledger-row">
            <div className="admin-avatar">{item.display_name.slice(0, 1).toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-100">{item.display_name}</p>
              <p className="mt-1 text-xs text-slate-500">ينتهي في {dateLabel(item.subscription_expires_at)}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${planTone[item.plan]}`}>{item.plan}</span>
          </div>
        )) : <p className="border-t border-white/[0.07] px-6 py-10 text-center text-sm text-slate-500">لا توجد اشتراكات تحتاج متابعة الآن.</p>}
      </section>
    </div>
  );
};

type UserDraft = { plan: Plan; daily: string; used: string; monthly: string; monthlyUsed: string; role: 'user' | 'admin'; months: string };

const UsersView = ({ users, busy, onPatch }: { users: AdminUser[]; busy: string | null; onPatch: (user: AdminUser, changes: Record<string, unknown>) => void }) => {
  const [draft, setDraft] = useState<Record<string, UserDraft>>({});
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(users[0]?.id || null);
  const rows = useMemo(() => users.map(item => ({
    item,
    value: draft[item.id] || {
      plan: item.plan,
      daily: String(item.daily_credits),
      used: String(item.credits_used_today),
      monthly: String(item.monthly_credits),
      monthlyUsed: String(item.monthly_credits_used),
      role: item.role,
      months: '',
    },
  })), [users, draft]);

  const visibleRows = rows.filter(({ item }) => `${item.display_name} ${item.email} ${item.phone || ''}`.toLowerCase().includes(query.toLowerCase()));
  const selected = rows.find(({ item }) => item.id === selectedId) || visibleRows[0] || rows[0];

  const change = (id: string, row: UserDraft, key: keyof UserDraft, value: string) => {
    setDraft(current => ({ ...current, [id]: { ...row, [key]: value } }));
  };

  return (
    <div>
      <PageHeading label="الحسابات" title="دليل المستخدمين" description="اختر حسابًا من الدليل ثم عدّل تفاصيله من مساحة عمل واحدة وواضحة." />
      <div className="admin-users-layout">
        <aside className="admin-directory">
          <label className="admin-search"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="ابحث بالاسم أو البريد…" /></label>
          <div className="admin-directory-meta"><span>{visibleRows.length} حساب</span><span>اختر للتعديل</span></div>
          <div className="admin-directory-list">
            {visibleRows.map(({ item }) => (
              <button key={item.id} onClick={() => setSelectedId(item.id)} className={selected?.item.id === item.id ? 'is-active' : ''}>
                <span className="admin-avatar">{item.display_name.slice(0, 1).toUpperCase()}</span>
                <span className="min-w-0 flex-1 text-right"><strong>{item.display_name}</strong><small>{item.email}</small></span>
                <span className={`admin-plan-dot admin-plan-${item.plan}`} />
              </button>
            ))}
            {!visibleRows.length && <p className="p-8 text-center text-sm text-slate-500">لا توجد نتائج مطابقة.</p>}
          </div>
        </aside>

        {selected ? <UserInspector key={selected.item.id} item={selected.item} value={selected.value} busy={busy} onChange={(key, value) => change(selected.item.id, selected.value, key, value)} onSave={() => onPatch(selected.item, {
          plan: selected.value.plan,
          dailyCredits: Number(selected.value.daily),
          creditsUsedToday: Number(selected.value.used),
          monthlyCredits: Number(selected.value.monthly),
          monthlyCreditsUsed: Number(selected.value.monthlyUsed),
          role: selected.value.role,
          ...(Number(selected.value.months) > 0 ? { subscriptionMonths: Number(selected.value.months) } : {}),
        })} /> : <div className="admin-empty-panel">اختر حسابًا للبدء.</div>}
      </div>
    </div>
  );
};

const UserInspector = ({ item, value, busy, onChange, onSave }: { item: AdminUser; value: UserDraft; busy: string | null; onChange: (key: keyof UserDraft, value: string) => void; onSave: () => void }) => (
  <section className="admin-inspector">
    <header>
      <div className="admin-avatar admin-avatar-lg">{item.display_name.slice(0, 1).toUpperCase()}</div>
      <div className="min-w-0 flex-1"><p className="truncate text-xl font-bold text-white">{item.display_name}</p><p className="mt-1 truncate text-sm text-slate-500">{item.email}</p></div>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${planTone[item.plan]}`}>{item.plan}</span>
    </header>
    <div className="admin-account-facts">
      <div><span>المشاريع</span><strong>{item.project_count}</strong></div>
      <div><span>انتهاء الاشتراك</span><strong>{dateLabel(item.subscription_expires_at)}</strong></div>
      <div><span>الهاتف</span><strong>{item.phone || 'غير مسجل'}</strong></div>
    </div>
    <div className="admin-form-section">
      <div className="admin-form-title"><span>01</span><div><h3>الخطة والصلاحية</h3><p>نوع الحساب ومدة تجديد الاشتراك.</p></div></div>
      <div className="admin-form-grid">
        <AdminField label="الخطة"><select value={value.plan} onChange={event => onChange('plan', event.target.value)}><option value="free">Free</option><option value="pro">Pro</option><option value="business">Business</option></select></AdminField>
        <AdminField label="الدور"><select value={value.role} disabled={item.email === 'youssef.official.2411@gmail.com'} onChange={event => onChange('role', event.target.value)}><option value="user">User</option><option value="admin">Admin</option></select></AdminField>
        <AdminField label="تجديد بالشهور"><AdminNumber value={value.months} min={1} max={120} placeholder="مثال 6" onChange={next => onChange('months', next)} /></AdminField>
      </div>
    </div>
    <div className="admin-form-section">
      <div className="admin-form-title"><span>02</span><div><h3>ميزانية الاستخدام</h3><p>حدود الاعتمادات اليومية والشهرية.</p></div></div>
      <div className="admin-form-grid admin-form-grid-4">
        <AdminField label="الرصيد اليومي"><AdminNumber value={value.daily} onChange={next => onChange('daily', next)} /></AdminField>
        <AdminField label="المستخدم اليوم"><AdminNumber value={value.used} onChange={next => onChange('used', next)} /></AdminField>
        <AdminField label="الرصيد الشهري"><AdminNumber value={value.monthly} onChange={next => onChange('monthly', next)} /></AdminField>
        <AdminField label="المستخدم شهريًا"><AdminNumber value={value.monthlyUsed} onChange={next => onChange('monthlyUsed', next)} /></AdminField>
      </div>
    </div>
    <footer><span><Check size={15} /> التغييرات لا تُطبّق قبل الحفظ</span><button disabled={busy === item.id} onClick={onSave}>{busy === item.id ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}</button></footer>
  </section>
);

const AdminField = ({ label, children }: { label: string; children: ReactNode }) => <label className="admin-field"><span>{label}</span>{children}</label>;

const AdminNumber = ({ value, onChange, min = 0, max, placeholder }: { value: string; onChange: (value: string) => void; min?: number; max?: number; placeholder?: string }) => (
  <input type="number" min={min} max={max} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="w-24" />
);

const SeasonView = ({ seasons, busy, onToggle }: { seasons: Celebration[]; busy: string | null; onToggle: (season: Celebration) => void }) => (
  <div>
    <PageHeading label="الموقع" title="الاحتفالات الموسمية" description="فعّل المؤثر المناسب أو أوقفه فورًا على جميع جلسات المستخدمين." />
    <div className="admin-season-grid">
      {seasons.map(item => (
        <article key={item.name} className={`admin-season-card admin-season-${item.name}`}>
          <div className="admin-season-visual" aria-hidden="true">
            {item.name === 'ramadan' ? <><span className="crescent">☾</span><i /><i /><i /></> : <><span className="burst">✦</span><i /><i /><i /></>}
          </div>
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <span className="admin-kicker">{item.name === 'ramadan' ? 'رمضان' : 'العيد'}</span>
              <span className={`admin-status-pill ${item.isActive ? 'is-on' : ''}`}><i />{item.isActive ? 'يظهر الآن' : 'متوقف'}</span>
            </div>
            <h2>{item.name === 'ramadan' ? 'سماء Vivora الليلية' : 'لحظة احتفال نابضة'}</h2>
            <p>{item.name === 'ramadan' ? 'هلال ونجوم هادئة تتحرك فوق واجهة الصفحة الرئيسية.' : 'قصاصات وردية وخضراء تحتفل مع المستخدمين في الصفحة الرئيسية.'}</p>
          </div>
          <div className="relative z-10 mt-auto flex items-center justify-between border-t border-white/[0.08] pt-5">
            <span className="text-xs text-slate-500">تطبيق فوري على كل الجلسات</span>
          <button
            type="button"
            role="switch"
            aria-checked={item.isActive}
            aria-label={`${item.name === 'ramadan' ? 'رمضان' : 'العيد'}: ${item.isActive ? 'مفعّل' : 'متوقف'}`}
            onClick={() => onToggle(item)}
            disabled={busy === item.name}
            className={`relative h-8 w-14 rounded-full transition ${item.isActive ? 'bg-pink-500' : 'bg-slate-700'}`}
          >
            <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-[0_4px_10px_rgba(0,0,0,.25)] transition ${item.isActive ? 'right-1' : 'right-7'}`} />
          </button>
          </div>
        </article>
      ))}
    </div>
  </div>
);

const BackupView = ({ backups, schedule, busy, onCreate }: { backups: Backup[]; schedule: Schedule | null; busy: string | null; onCreate: () => void }) => (
  <div>
    <PageHeading
      label="الحماية والاستعادة"
      title="النسخ الاحتياطية"
      description="راجع دورات الحفظ وأنشئ نقطة استعادة يدوية قبل أي تغيير حساس."
      action={<button onClick={onCreate} disabled={busy === 'backup'} className="admin-primary-action"><Database size={16} />{busy === 'backup' ? 'جارٍ الإنشاء…' : 'إنشاء نقطة استعادة'}</button>}
    />
    <div className="admin-backup-layout">
      <aside className="admin-backup-policy">
        <span className="admin-kicker"><ShieldCheck size={14} /> سياسة الحماية</span>
        <h2>جدولة متعددة الطبقات</h2>
        <p>ثلاث دورات مستقلة تقلّل المسافة بين آخر حالة سليمة وأي تغيير غير متوقع.</p>
        <div className="mt-7">
          {([['كل ساعة', schedule?.hourly], ['كل يوم', schedule?.daily], ['كل أسبوع', schedule?.weekly]] as const).map(([label, value], index) => (
            <div key={label} className="admin-policy-row"><span>0{index + 1}</span><div><strong>{label}</strong><small>{value || 'غير متاح'}</small></div><Check size={15} /></div>
          ))}
        </div>
      </aside>
      <section className="admin-backup-timeline">
        <div className="admin-section-head"><div><p className="admin-eyebrow">RESTORE POINTS</p><h2>سجل النسخ</h2><p>الأحدث أولًا، مع وقت الإنشاء ونوع الدورة.</p></div><span>{backups.length}</span></div>
        <div className="admin-timeline-list">
          {backups.length ? backups.map((item, index) => (
            <div key={item.id} className="admin-timeline-item">
              <div className="admin-timeline-mark"><span />{index < backups.length - 1 && <i />}</div>
              <div className="min-w-0 flex-1"><p className="truncate font-semibold text-white">{item.filename}</p><small>{new Date(item.created_at).toLocaleString('ar-EG')}</small></div>
              <span className="admin-kind-pill">{item.kind}</span>
              <ArrowUpLeft size={16} className="text-slate-600" />
            </div>
          )) : <p className="px-6 py-12 text-center text-sm text-slate-500">لا توجد نسخ احتياطية بعد.</p>}
        </div>
      </section>
    </div>
  </div>
);
