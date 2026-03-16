import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, FileWarning, CheckCircle, Sparkles, Plus } from 'lucide-react';
import { useDashboardData } from '@/hooks/use-dashboard';
import { StatCard } from '@/components/StatCard';
import { FreshnessLoop } from '@/components/FreshnessLoop';
import { DataTable } from '@/components/DataTable';
import { CsvUploadModal } from '@/components/CsvUploadModal';

export default function Dashboard() {
  const { pages, stats, isLoading } = useDashboardData();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground font-medium animate-pulse">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Fallback defaults if stats are not yet generated
  const safeStats = stats || {
    totalPages: 0,
    freshPercent: 0,
    criticalCount: 0,
    reviewCount: 0,
    healthyCount: 0,
    aiCitationReadyCount: 0,
    avgFreshnessScore: 0
  };

  return (
    <div className="min-h-screen pb-20 relative">
      {/* Background decoration */}
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
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Live Tracking Active
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-500">
              Content Freshness
            </h1>
            <p className="text-muted-foreground mt-2 text-lg max-w-xl">
              Monitor content decay, prioritize updates, and optimize your pages for AI Search Generation (GEO).
            </p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-white text-black hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus size={18} />
            Import Data
          </motion.button>
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
              Upload an export from Google Search Console or your CMS to begin analyzing your content freshness and AI search readiness.
            </p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-8 py-3 rounded-xl font-semibold bg-primary text-primary-foreground shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_rgba(99,102,241,0.6)] hover:bg-primary/90 transition-all hover:-translate-y-1"
            >
              Upload CSV Export
            </button>
          </motion.div>
        ) : (
          <>
            <FreshnessLoop percentage={safeStats.freshPercent} />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <StatCard 
                title="Total Pages Tracked" 
                value={safeStats.totalPages.toLocaleString()} 
                icon={Layers} 
                delay={0.1}
                colorClassName="bg-blue-500"
              />
              <StatCard 
                title="Critical Refresh" 
                value={safeStats.criticalCount.toLocaleString()} 
                icon={FileWarning} 
                delay={0.2}
                colorClassName="bg-destructive"
              />
              <StatCard 
                title="Healthy Pages" 
                value={safeStats.healthyCount.toLocaleString()} 
                icon={CheckCircle} 
                delay={0.3}
                colorClassName="bg-success"
              />
              <StatCard 
                title="AI Citation Ready" 
                value={safeStats.aiCitationReadyCount.toLocaleString()} 
                icon={Sparkles} 
                delay={0.4}
                colorClassName="bg-indigo-500"
              />
            </div>

            {/* Main Table Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <DataTable pages={pages} />
            </motion.div>
          </>
        )}
      </div>

      <CsvUploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />
    </div>
  );
}
