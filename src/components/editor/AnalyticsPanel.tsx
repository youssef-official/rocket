import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Users, Eye, Clock, Globe, Activity, RefreshCw, TrendingUp } from 'lucide-react';

interface AnalyticsData {
  sessions: Array<{
    id: string;
    start: number;
    end: number;
    duration: number;
    pages: number;
    device: string;
    country: string;
    referrer: string;
    topPages: string[];
  }>;
  pageViews: Record<string, number>;
  totalVisits: number;
}

interface AnalyticsPanelProps {
  previewUrl: string | null;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ previewUrl }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = () => {
    setLoading(true);
    // Try to read from localStorage (analyzer.js stores data there)
    try {
      const raw = localStorage.getItem('vx_analytics');
      if (raw) {
        setData(JSON.parse(raw));
      } else {
        setData({ sessions: [], pageViews: {}, totalVisits: 0 });
      }
    } catch {
      setData({ sessions: [], pageViews: {}, totalVisits: 0 });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 10000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    if (!data) return null;
    const sessions = data.sessions || [];
    const totalVisits = data.totalVisits || sessions.length;
    const totalPages = Object.values(data.pageViews || {}).reduce((a, b) => a + b, 0);
    const avgDuration = sessions.length > 0
      ? Math.round(sessions.reduce((a, s) => a + (s.duration || 0), 0) / sessions.length)
      : 0;
    const devices: Record<string, number> = {};
    const countries: Record<string, number> = {};
    sessions.forEach(s => {
      devices[s.device] = (devices[s.device] || 0) + 1;
      countries[s.country] = (countries[s.country] || 0) + 1;
    });
    const topPages = Object.entries(data.pageViews || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const recentSessions = sessions.slice(-20).reverse();
    return { totalVisits, totalPages, avgDuration, devices, countries, topPages, recentSessions };
  }, [data]);

  if (loading || !stats) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-8 h-8 text-muted-foreground animate-pulse" />
          <span className="text-sm text-muted-foreground">Loading analytics...</span>
        </div>
      </div>
    );
  }

  const formatDuration = (s: number) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  const statCards = [
    { icon: Users, label: 'Total Visitors', value: stats.totalVisits, color: 'text-blue-500' },
    { icon: Eye, label: 'Page Views', value: stats.totalPages, color: 'text-green-500' },
    { icon: Clock, label: 'Avg Duration', value: formatDuration(stats.avgDuration), color: 'text-purple-500' },
    { icon: TrendingUp, label: 'Pages/Visit', value: stats.totalVisits > 0 ? (stats.totalPages / stats.totalVisits).toFixed(1) : '0', color: 'text-orange-500' },
  ];

  return (
    <div className="h-full overflow-y-auto bg-background p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Analytics</h2>
        </div>
        <button
          onClick={fetchAnalytics}
          className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border/60 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`w-4 h-4 ${card.color}`} />
              <span className="text-xs text-muted-foreground font-medium">{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Top Pages */}
      <div className="bg-card border border-border/60 rounded-xl p-4 mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          Top Pages
        </h3>
        {stats.topPages.length === 0 ? (
          <p className="text-xs text-muted-foreground">No page views yet</p>
        ) : (
          <div className="space-y-2">
            {stats.topPages.map(([path, count]) => {
              const maxCount = stats.topPages[0]?.[1] || 1;
              const pct = ((count as number) / (maxCount as number)) * 100;
              return (
                <div key={path} className="flex items-center gap-2">
                  <div className="flex-1 relative h-6 bg-accent/30 rounded overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-primary/20 rounded"
                      style={{ width: `${pct}%` }}
                    />
                    <span className="absolute inset-y-0 left-2 flex items-center text-xs text-foreground font-medium truncate">
                      {path}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Devices */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">Devices</h3>
          {Object.entries(stats.devices).length === 0 ? (
            <p className="text-xs text-muted-foreground">No data</p>
          ) : (
            Object.entries(stats.devices).map(([device, count]) => (
              <div key={device} className="flex justify-between text-sm">
                <span className="capitalize text-foreground">{device}</span>
                <span className="font-bold text-foreground">{count}</span>
              </div>
            ))
          )}
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">Regions</h3>
          {Object.entries(stats.countries).length === 0 ? (
            <p className="text-xs text-muted-foreground">No data</p>
          ) : (
            Object.entries(stats.countries).slice(0, 5).map(([tz, count]) => (
              <div key={tz} className="flex justify-between text-sm">
                <span className="text-foreground truncate text-xs">{tz.split('/').pop()}</span>
                <span className="font-bold text-foreground">{count}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-card border border-border/60 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Recent Sessions</h3>
        {stats.recentSessions.length === 0 ? (
          <p className="text-xs text-muted-foreground">No sessions recorded yet. Analytics data will appear here once the published site receives visitors.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {stats.recentSessions.map(s => (
              <div key={s.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="capitalize text-muted-foreground">{s.device}</span>
                  <span className="text-foreground">{s.pages} pages</span>
                </div>
                <span className="text-muted-foreground">{formatDuration(s.duration)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!previewUrl && (
        <div className="mt-4 p-3 bg-accent/30 rounded-xl text-xs text-muted-foreground text-center">
          Publish your project to start collecting real visitor analytics.
        </div>
      )}
    </div>
  );
};
