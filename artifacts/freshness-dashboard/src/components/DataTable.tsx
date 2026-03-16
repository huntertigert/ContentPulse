import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  BrainCircuit, 
  Trash2, 
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';
import { PageFreshness, PageFreshnessTriageStatus } from '@workspace/api-client-react';
import { cn } from '@/lib/utils';
import { useDashboardMutations } from '@/hooks/use-dashboard';

interface DataTableProps {
  pages: PageFreshness[];
}

export function DataTable({ pages }: DataTableProps) {
  const [activeTab, setActiveTab] = useState<PageFreshnessTriageStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { deletePage } = useDashboardMutations();

  const filteredPages = pages.filter(page => {
    const matchesTab = activeTab === 'all' || page.triageStatus === activeTab;
    const matchesSearch = page.url.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (page.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  }).sort((a, b) => b.decayScore - a.decayScore);

  const tabs: { id: PageFreshnessTriageStatus | 'all', label: string, count: number, color?: string }[] = [
    { id: 'all', label: 'All Pages', count: pages.length },
    { id: 'critical', label: 'Critical Refresh', count: pages.filter(p => p.triageStatus === 'critical').length, color: 'text-destructive' },
    { id: 'review', label: 'Needs Review', count: pages.filter(p => p.triageStatus === 'review').length, color: 'text-warning' },
    { id: 'healthy', label: 'Healthy', count: pages.filter(p => p.triageStatus === 'healthy').length, color: 'text-success' },
  ];

  const getTrafficIcon = (trend: string) => {
    switch(trend) {
      case 'up': return <ArrowUpRight className="text-success" size={16} />;
      case 'down': return <ArrowDownRight className="text-destructive" size={16} />;
      default: return <Minus className="text-muted-foreground" size={16} />;
    }
  };

  const getTriageBadge = (status: PageFreshnessTriageStatus) => {
    switch(status) {
      case 'critical': 
        return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-destructive/15 text-destructive border border-destructive/20 shadow-[0_0_10px_rgba(225,29,72,0.2)]">Critical</span>;
      case 'review': 
        return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-warning/15 text-warning border border-warning/20">Review</span>;
      case 'healthy': 
        return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-success/15 text-success border border-success/20">Healthy</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Table Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex gap-2 p-1 bg-black/40 border border-white/5 rounded-xl backdrop-blur-md overflow-x-auto w-full md:w-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-white/10 text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <span className={tab.color}>{tab.label}</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs",
                activeTab === tab.id ? "bg-white/10" : "bg-black/30"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input 
            type="text" 
            placeholder="Search URLs..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-black/20 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="p-4 font-medium">Page URL</th>
                <th className="p-4 font-medium text-right">Traffic (30d)</th>
                <th className="p-4 font-medium">Last Updated</th>
                <th className="p-4 font-medium text-center">Freshness</th>
                <th className="p-4 font-medium text-center">Decay</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">AI Citation</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {filteredPages.length > 0 ? (
                  filteredPages.map((page, i) => (
                    <motion.tr 
                      key={page.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: i * 0.05 }}
                      className={cn(
                        "group hover:bg-white/[0.02] transition-colors",
                        page.triageStatus === 'critical' && "bg-destructive/[0.02] hover:bg-destructive/[0.04]"
                      )}
                    >
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-foreground font-medium text-sm truncate max-w-[250px]" title={page.title || page.url}>
                            {page.title || 'Untitled Page'}
                          </span>
                          <a 
                            href={page.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-muted-foreground text-xs hover:text-primary transition-colors flex items-center gap-1 mt-0.5 truncate max-w-[250px]"
                          >
                            {page.url.replace(/^https?:\/\//, '')}
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm font-semibold text-foreground">{page.clicks30d.toLocaleString()}</span>
                          {getTrafficIcon(page.trafficTrend)}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(page.lastUpdated), { addSuffix: true })}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-16 h-1.5 bg-black/50 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full",
                                page.freshnessScore > 70 ? "bg-success" : page.freshnessScore > 40 ? "bg-warning" : "bg-destructive"
                              )}
                              style={{ width: `${page.freshnessScore}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-muted-foreground">{Math.round(page.freshnessScore)}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={cn(
                          "text-sm font-display font-bold",
                          page.decayScore > 70 ? "text-destructive text-glow" : "text-foreground"
                        )}>
                          {Math.round(page.decayScore)}
                        </span>
                      </td>
                      <td className="p-4">
                        {getTriageBadge(page.triageStatus)}
                      </td>
                      <td className="p-4">
                        {page.aiCitationLikely ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 w-max">
                            <BrainCircuit size={14} className="animate-pulse" />
                            <span className="text-xs font-semibold">Likely</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-muted-foreground w-max">
                            <BrainCircuit size={14} className="opacity-50" />
                            <span className="text-xs font-medium">Unlikely</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => deletePage.mutate({ id: page.id })}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove from tracking"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr className="border-none">
                    <td colSpan={8} className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Filter size={32} className="mb-3 opacity-20" />
                        <p className="text-lg font-medium text-foreground">No pages found</p>
                        <p className="text-sm mt-1">Try adjusting your filters or upload new data.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
