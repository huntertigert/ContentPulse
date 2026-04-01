import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Layers, FileWarning, CheckCircle, Sparkles, Plus, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useDashboardData } from '@/hooks/use-dashboard';
import { useSettings, useSyncActions } from '@/hooks/use-sync';
import { StatCard } from '@/components/StatCard';
import { FreshnessLoop } from '@/components/FreshnessLoop';
import { DataTable, filterByContentType, type ContentType } from '@/components/DataTable';
import { CsvUploadModal } from '@/components/CsvUploadModal';
import { ConnectModal } from '@/components/ConnectModal';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { pages, stats, isLoading } = useDashboardData();
  const { settings, syncStatus } = useSettings();
  const { syncSitemap, syncGsc } = useSyncActions();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('blog');

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

  const isConnected = syncStatus?.sitemapConfigured || syncStatus?.gscConfigured
    || settings?.sitemapUrl || settings?.gscHasCredentials;
  const isSyncing = syncSitemap.isPending || syncGsc.isPending;

  const handleQuickSync = () => {
    if (syncStatus?.sitemapConfigured || settings?.sitemapUrl) syncSitemap.mutate({});
    if ((syncStatus?.gscConfigured || settings?.gscHasCredentials) && !syncSitemap.isPending) syncGsc.mutate({});
  };

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
            <div className="mt-4 flex items-center gap-5 text-xs text-muted-foreground/70">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary/15 text-primary text-[9px] font-bold shrink-0">1</span>
                <span>Click <span className="text-foreground/80 font-medium">Import CSV</span></span>
              </div>
              <div className="w-4 h-px bg-white/10" />
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary/15 text-primary text-[9px] font-bold shrink-0">2</span>
                <span>Choose a format (GSC, WordPress, SEMrush)</span>
              </div>
              <div className="w-4 h-px bg-white/10" />
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary/15 text-primary text-[9px] font-bold shrink-0">3</span>
                <span>Review scores and triage</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 flex-wrap"
          >
            {/* Connection status + quick sync */}
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all",
                isConnected
                  ? "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/15"
                  : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
              )}
            >
              {isConnected ? <Wifi size={15} /> : <WifiOff size={15} />}
              {isConnected ? "Connected" : "Connect Site"}
            </button>

            {isConnected && (
              <button
                onClick={handleQuickSync}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all disabled:opacity-50"
              >
                <RefreshCw size={15} className={cn(isSyncing && "animate-spin")} />
                {isSyncing ? "Syncing..." : "Sync Now"}
              </button>
            )}

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-white text-black hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus size={18} />
              Import CSV
            </button>
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
              Connect your site for automatic live tracking, or upload a CSV export from Google Search Console or your CMS.
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="px-8 py-3 rounded-xl font-semibold bg-primary text-primary-foreground shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_rgba(99,102,241,0.6)] hover:bg-primary/90 transition-all hover:-translate-y-1"
              >
                Connect My Site
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-8 py-3 rounded-xl font-semibold bg-white/10 text-foreground hover:bg-white/15 transition-all hover:-translate-y-1 border border-white/10"
              >
                Upload CSV
              </button>
            </div>
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

      <CsvUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
      <ConnectModal isOpen={isConnectModalOpen} onClose={() => setIsConnectModalOpen(false)} />
    </div>
  );
}
