import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Globe2, Loader2, MousePointerClick, RefreshCw, Users } from 'lucide-react';
import { api } from '@/services/api';

interface AnalyticsData {
  totals: { visitors: number; pageviews: number; clicks: number };
  countries: Array<{ country: string; visitors: number }>;
  visitors: Array<{ visitorId: string; country: string; events: number; lastSeen: string }>;
  targets: Array<{ target: string; clicks: number }>;
}

const emptyAnalytics: AnalyticsData = {
  totals: { visitors: 0, pageviews: 0, clicks: 0 },
  countries: [],
  visitors: [],
  targets: [],
};

export const AnalyticsPanel = ({ projectId }: { projectId?: string; previewUrl?: string | null }) => {
  const [data, setData] = useState<AnalyticsData>(emptyAnalytics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError('');
    try {
      setData(await api<AnalyticsData>(`/projects/${projectId}/analytics`));
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(interval);
  }, [load]);

  if (loading && data.totals.pageviews === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-[#08111f] text-[#f5f7fa]">
        <Loader2 className="h-5 w-5 animate-spin text-[#ffb000]" aria-label="Loading analytics" />
      </div>
    );
  }

  const metrics = [
    { label: 'Visitors', value: data.totals.visitors, icon: Users },
    { label: 'Page views', value: data.totals.pageviews, icon: BarChart3 },
    { label: 'Total clicks', value: data.totals.clicks, icon: MousePointerClick },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#08111f] p-6 text-[#f5f7fa] sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col justify-between gap-5 border-b border-[#203b57] pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-[#2bc48a]">Live preview analytics</p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-.02em]">Project activity</h2>
            <p className="mt-2 text-sm text-[#9fb0c2]">Tracking is injected automatically. Publishing is not required.</p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#183552] px-4 text-sm font-semibold text-[#e6edf4] transition hover:bg-[#204565] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb000]"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </header>

        {error && <p className="mt-5 rounded-xl bg-[#4a2028] px-4 py-3 text-sm text-[#ffd9df]" role="alert">{error}</p>}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {metrics.map(({ label, value, icon: Icon }) => (
            <section key={label} className="rounded-2xl bg-[#10243c] p-5">
              <Icon className="text-[#ffb000]" size={19} />
              <p className="mt-8 text-3xl font-bold tabular-nums">{value}</p>
              <p className="mt-1 text-sm text-[#9fb0c2]">{label}</p>
            </section>
          ))}
        </div>

        {data.totals.pageviews === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center text-center">
            <BarChart3 className="text-[#5e7188]" size={30} />
            <h3 className="mt-4 text-lg font-bold">No activity yet</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#9fb0c2]">
              Open or refresh the Preview tab, then interact with the generated website. Visits and clicks will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <section className="overflow-hidden rounded-2xl bg-[#10243c]">
              <div className="flex items-center gap-2 border-b border-[#203b57] px-5 py-4">
                <Globe2 className="text-[#ffb000]" size={17} />
                <h3 className="font-bold">Visitors by country</h3>
              </div>
              {data.countries.map(country => (
                <div key={country.country} className="flex items-center justify-between border-b border-[#1a3149] px-5 py-3.5 last:border-0">
                  <span className="font-medium">{country.country === 'LOCAL' ? 'Local preview' : country.country}</span>
                  <span className="tabular-nums text-[#b9c7d7]">{country.visitors}</span>
                </div>
              ))}
            </section>

            <section className="overflow-hidden rounded-2xl bg-[#10243c]">
              <div className="flex items-center gap-2 border-b border-[#203b57] px-5 py-4">
                <MousePointerClick className="text-[#ffb000]" size={17} />
                <h3 className="font-bold">Most clicked elements</h3>
              </div>
              {data.targets.length ? data.targets.map(target => (
                <div key={target.target} className="flex items-center justify-between gap-4 border-b border-[#1a3149] px-5 py-3.5 last:border-0">
                  <span className="truncate text-sm">{target.target}</span>
                  <span className="shrink-0 tabular-nums text-[#b9c7d7]">{target.clicks}</span>
                </div>
              )) : <p className="px-5 py-8 text-sm text-[#9fb0c2]">No clicks recorded yet.</p>}
            </section>

            <section className="overflow-hidden rounded-2xl bg-[#10243c] lg:col-span-2">
              <div className="grid grid-cols-[minmax(0,1fr)_100px_90px] border-b border-[#203b57] px-5 py-3 text-xs font-semibold text-[#8fa3b7]">
                <span>Visitor</span><span>Country</span><span className="text-right">Events</span>
              </div>
              {data.visitors.map(visitor => (
                <div key={`${visitor.visitorId}-${visitor.country}`} className="grid grid-cols-[minmax(0,1fr)_100px_90px] items-center border-b border-[#1a3149] px-5 py-3.5 text-sm last:border-0">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{visitor.visitorId}</p>
                    <p className="mt-1 text-xs text-[#8296aa]">{new Date(visitor.lastSeen).toLocaleString()}</p>
                  </div>
                  <span>{visitor.country === 'LOCAL' ? 'Local' : visitor.country}</span>
                  <span className="text-right tabular-nums text-[#b9c7d7]">{visitor.events}</span>
                </div>
              ))}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
