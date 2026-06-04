import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Layers, FileWarning, CheckCircle, Sparkles, RefreshCw, LogOut, Type } from 'lucide-react';
import { useUser, useClerk } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetPagesQueryKey, getGetStatsQueryKey } from '@workspace/api-client-react';
import { useDashboardData } from '@/hooks/use-dashboard';
import { useSettings } from '@/hooks/use-sync';
import { useToast } from '@/hooks/use-toast';
import { StatCard } from '@/components/StatCard';
import { FreshnessLoop } from '@/components/FreshnessLoop';
import { DataTable, filterByContentType, type ContentType } from '@/components/DataTable';
import { CsvUploadModal } from '@/components/CsvUploadModal';
import { cn } from '@/lib/utils';

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS ?? 'hunter.tigert@alkami.com')
  .split(',')
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

export default function Dashboard() {
  const { pages, stats, isLoading } = useDashboardData();
  const { syncStatus } = useSettings();
  const { user } = useUser();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const currentEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const isAdmin = !!currentEmail && ADMIN_EMAILS.includes(currentEmail);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('blog');
  const [isFixingTitles, setIsFixingTitles] = useState(false);

  const handleFixTitles = async () => {
    setIsFixingTitles(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/sync/fix-titles`, { method: 'POST' });
      const data = await res.json();
      toast({
        title: data.success ? 'Titles Fixed' : 'Fix Titles Issue',
        description: data.message,
        variant: data.success ? 'default' : 'destructive',
      });
      queryClient.invalidateQueries({ queryKey: getGetPagesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
    } catch (err: any) {
      toast({ title: 'Fix Titles Failed', description: err?.message || 'Network error', variant: 'destructive' });
    } finally {
      setIsFixingTitles(false);
    }
  };

  const untitledCount = useMemo(
    () => pages.filter(p => !p.title || p.title.trim() === '').length,
    [pages]
  );

  const filteredPages = useMemo(() => filterByContentType(pages, contentType), [pages, contentType]);

  const filteredStats = useMemo(() => {
    const fp = filteredPages;
    const now = Date.now();
    const freshCount = fp.filter(p => {
      const days = (now - new Date(p.lastUpdated).getTime()) / 86400000;
      return days < 90;
    }).length;
    return {
      totalPages: fp.length,
      freshPercent: fp.length > 0 ? Math.round((freshCount / fp.length) * 1000) / 10 : 0,
      criticalCount: fp.filter(p => p.triageStatus === 'critical').length,
      healthyCount: fp.filter(p => p.triageStatus === 'healthy').length,
      aiCitationReadyCount: fp.filter(p => p.aiCitationLikely).length,
    };
  }, [filteredPages]);

  const lastRefresh = syncStatus?.lastSitemapSync ? new Date(syncStatus.lastSitemapSync) : null;
  const lastRefreshLabel = lastRefresh
    ? lastRefresh.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const safeStats = filteredStats;

  return (
    <div className="min-h-screen pb-20 relative">
      <img
        src={`${import.meta.env.BASE_URL}images/bg-glow.png`}
        alt=""
        className="fixed top-0 left-0 w-full h-full object-cover opacity-30 pointer-events-none mix-blend-screen"
        aria-hidden="true"
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 relative z-10">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-4 w-max">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Live Tracking Active
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-500">
              Content Freshness
            </h1>
            <p className="text-muted-foreground mt-2 text-lg max-w-xl">
              Monitor content decay, prioritize updates, and optimize your pages for AI Search Generation (GEO).
            </p>
            <div className="mt-4 flex items-center gap-5 text-xs text-muted-foreground/70 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary/15 text-primary text-[9px] font-bold shrink-0">1</span>
                <span>Export this month's <span className="text-foreground/80 font-medium">SEMrush</span> and <span className="text-foreground/80 font-medium">GSC</span> CSVs</span>
              </div>
              <div className="w-4 h-px bg-white/10" />
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary/15 text-primary text-[9px] font-bold shrink-0">2</span>
                <span>Click <span className="text-foreground/80 font-medium">Monthly Refresh</span> and drop them in</span>
              </div>
              <div className="w-4 h-px bg-white/10" />
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary/15 text-primary text-[9px] font-bold shrink-0">3</span>
                <span>Review scores and triage</span>
              </div>
              {lastRefreshLabel && (
                <>
                  <div className="w-4 h-px bg-white/10" />
                  <span className="text-foreground/60">Last refresh: <span className="text-foreground/80 font-medium">{lastRefreshLabel}</span></span>
                </>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 flex-wrap"
          >
            {untitledCount > 0 && (
              <button
                onClick={handleFixTitles}
                disabled={isFixingTitles}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/15 transition-all disabled:opacity-50"
                title={`${untitledCount} pages have no title. Click to scrape them.`}
              >
                <Type size={15} className={cn(isFixingTitles && "animate-pulse")} />
                {isFixingTitles ? "Fixing..." : `Fix Titles (${untitledCount})`}
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-white text-black hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                <RefreshCw size={18} />
                Monthly Refresh
              </button>
            )}

            {user && (
              <div className="flex items-center gap-2 ml-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  {user.imageUrl && (
                    <img src={user.imageUrl} alt="" className="w-6 h-6 rounded-full" />
                  )}
                  <span className="text-xs text-gray-400 max-w-[140px] truncate">
                    {user.primaryEmailAddress?.emailAddress}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                  title="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </motion.div>
        </header>

        {pages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-3xl p-16 flex flex-col items-center justify-center text-center mt-12 border-dashed border-2"
          >
            <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
              <Layers size={40} />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-3">No content being tracked yet</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              {isAdmin
                ? "Run your first monthly refresh — upload this month's SEMrush and GSC CSV exports and the dashboard will populate."
                : "No content is being tracked yet. The workspace admin needs to run the monthly refresh to populate the dashboard."}
            </p>
            {isAdmin && (
              <div className="flex gap-3 flex-wrap justify-center">
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-8 py-3 rounded-xl font-semibold bg-primary text-primary-foreground shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_rgba(99,102,241,0.6)] hover:bg-primary/90 transition-all hover:-translate-y-1"
                >
                  Run Monthly Refresh
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <>
            <FreshnessLoop percentage={safeStats.freshPercent} />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <StatCard title="Total Pages Tracked" value={safeStats.totalPages.toLocaleString()} icon={Layers} delay={0.1} colorClassName="bg-blue-500" />
              <StatCard title="Critical Refresh" value={safeStats.criticalCount.toLocaleString()} icon={FileWarning} delay={0.2} colorClassName="bg-destructive" />
              <StatCard title="Healthy Pages" value={safeStats.healthyCount.toLocaleString()} icon={CheckCircle} delay={0.3} colorClassName="bg-success" />
              <StatCard title="AI Citation Ready" value={safeStats.aiCitationReadyCount.toLocaleString()} icon={Sparkles} delay={0.4} colorClassName="bg-indigo-500" />
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <DataTable pages={filteredPages} contentType={contentType} onContentTypeChange={setContentType} />
            </motion.div>
          </>
        )}
      </div>

      {isAdmin && (
        <CsvUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
      )}
    </div>
  );
}
