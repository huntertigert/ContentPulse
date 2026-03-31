import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  BrainCircuit, 
  Trash2, 
  ExternalLink,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp as ChevronUpIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Lightbulb,
  Zap,
  Download,
  CheckSquare,
  Square,
  MinusSquare,
  Clock,
  PlayCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { PageFreshness, PageFreshnessTriageStatus } from '@workspace/api-client-react';
import { cn } from '@/lib/utils';
import { useDashboardMutations } from '@/hooks/use-dashboard';

const PAGE_SIZE = 12;

type SortField = 'title' | 'clicks30d' | 'lastUpdated' | 'freshnessScore' | 'decayScore' | 'triageStatus' | 'aiCitationLikely' | 'semrushVolume' | 'priorityScore';
type SortDir = 'asc' | 'desc';
type DateFilter = 'all' | '1m' | '3m' | '6m' | '1y' | '1.5y' | '2y';
export type ContentType = 'all' | 'blog' | 'news' | 'blog+news';

export function filterByContentType(pages: PageFreshness[], ct: ContentType) {
  if (ct === 'all') return pages;
  return pages.filter(p => {
    const url = p.url.toLowerCase();
    if (ct === 'blog') return url.includes('/blog/');
    if (ct === 'news') return url.includes('/news/');
    return url.includes('/blog/') || url.includes('/news/');
  });
}

function getWorkflowBadge(status: string | null | undefined) {
  switch (status) {
    case 'queued':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
          <Clock size={10} />
          Queued
        </span>
      );
    case 'in_progress':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
          <PlayCircle size={10} />
          In Progress
        </span>
      );
    case 'refreshed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 size={10} />
          Refreshed
        </span>
      );
    default:
      return null;
  }
}

function escapeCsvField(value: string | number | null | undefined): string {
  if (value == null) return '';
  let str = String(value);
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousPrefixes.some(p => str.startsWith(p))) {
    str = `'${str}`;
  }
  str = str.replace(/"/g, '""').replace(/\r?\n/g, ' ');
  return `"${str}"`;
}

function exportToCsv(pages: PageFreshness[]) {
  const headers = [
    'URL', 'Title', 'Priority Score', 'Decay Score', 'Status', 'Traffic (30d)',
    'Traffic Trend', 'Last Updated', 'Days Since Update', 'AI Citation Likely',
    'Word Count', 'Workflow Status', 'Keywords Count', 'Total Volume',
    'Top Keyword', 'Top Position', 'Recommendations'
  ];

  const rows = pages.map(p => [
    p.url,
    p.title || '',
    p.priorityScore,
    p.decayScore,
    p.triageStatus,
    p.clicks30d,
    p.trafficTrend,
    format(new Date(p.lastUpdated), 'yyyy-MM-dd'),
    p.daysSinceUpdate,
    p.aiCitationLikely ? 'Yes' : 'No',
    p.wordCount,
    p.workflowStatus || '',
    p.semrushKeywords ?? '',
    p.semrushVolume ?? '',
    p.semrushTopKeyword ?? '',
    p.semrushTopPosition ?? '',
    (p.refreshRecommendations || []).join(' | '),
  ]);

  const csv = [
    headers.map(h => escapeCsvField(h)).join(','),
    ...rows.map(r => r.map(v => escapeCsvField(v)).join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `content-freshness-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface DataTableProps {
  pages: PageFreshness[];
  contentType: ContentType;
  onContentTypeChange: (ct: ContentType) => void;
}

export function DataTable({ pages, contentType, onContentTypeChange }: DataTableProps) {
  const [activeTab, setActiveTab] = useState<PageFreshnessTriageStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('priorityScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [expandedKeywords, setExpandedKeywords] = useState<Set<number>>(new Set());
  const [expandedRecs, setExpandedRecs] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const { deletePage, batchStatus } = useDashboardMutations();

  const toggleKeywords = (pageId: number) => {
    setExpandedKeywords(prev => {
      const next = new Set(prev);
      if (next.has(pageId)) next.delete(pageId);
      else next.add(pageId);
      return next;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'title' ? 'asc' : 'desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="opacity-30" />;
    return sortDir === 'asc'
      ? <ArrowUp size={12} className="text-primary" />
      : <ArrowDown size={12} className="text-primary" />;
  };

  const filteredPages = useMemo(() => {
    const now = Date.now();
    return pages
      .filter(page => {
        const matchesTab = activeTab === 'all' || page.triageStatus === activeTab;
        const matchesSearch = page.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (page.title || '').toLowerCase().includes(searchQuery.toLowerCase());

        let matchesDate = true;
        if (dateFilter !== 'all') {
          const daysSince = Math.floor((now - new Date(page.lastUpdated).getTime()) / (1000 * 60 * 60 * 24));
          if (dateFilter === '1m') matchesDate = daysSince <= 30;
          else if (dateFilter === '3m') matchesDate = daysSince <= 90;
          else if (dateFilter === '6m') matchesDate = daysSince <= 180;
          else if (dateFilter === '1y') matchesDate = daysSince <= 365;
          else if (dateFilter === '1.5y') matchesDate = daysSince <= 548;
          else if (dateFilter === '2y') matchesDate = daysSince <= 730;
        }

        return matchesTab && matchesSearch && matchesDate;
      })
      .sort((a, b) => {
        let cmp = 0;
        switch (sortField) {
          case 'title':
            cmp = (a.title || a.url).localeCompare(b.title || b.url);
            break;
          case 'clicks30d':
            cmp = a.clicks30d - b.clicks30d;
            break;
          case 'lastUpdated':
            cmp = new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
            break;
          case 'freshnessScore':
            cmp = a.freshnessScore - b.freshnessScore;
            break;
          case 'decayScore':
            cmp = a.decayScore - b.decayScore;
            break;
          case 'triageStatus': {
            const order: Record<string, number> = { critical: 0, review: 1, healthy: 2 };
            cmp = (order[a.triageStatus] ?? 1) - (order[b.triageStatus] ?? 1);
            break;
          }
          case 'aiCitationLikely':
            cmp = (a.aiCitationLikely ? 1 : 0) - (b.aiCitationLikely ? 1 : 0);
            break;
          case 'semrushVolume':
            cmp = (a.semrushVolume ?? 0) - (b.semrushVolume ?? 0);
            break;
          case 'priorityScore':
            cmp = a.priorityScore - b.priorityScore;
            break;
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [pages, activeTab, searchQuery, dateFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredPages.length / PAGE_SIZE));
  const pagedResults = filteredPages.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery, dateFilter, contentType, sortField, sortDir]);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const pageIds = pagedResults.map(p => p.id);
    const allSelected = pageIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach(id => next.delete(id));
      } else {
        pageIds.forEach(id => next.add(id));
      }
      return next;
    });
  }, [pagedResults, selectedIds]);

  const selectAllFiltered = useCallback(() => {
    setSelectedIds(new Set(filteredPages.map(p => p.id)));
  }, [filteredPages]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBatchStatus = useCallback((status: string | null) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    batchStatus.mutate({ data: { ids, status } });
    setSelectedIds(new Set());
  }, [selectedIds, batchStatus]);

  const pageIds = pagedResults.map(p => p.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.has(id));
  const somePageSelected = pageIds.some(id => selectedIds.has(id));

  const tabs: { id: PageFreshnessTriageStatus | 'all', label: string, count: number, color?: string }[] = [
    { id: 'all', label: 'All Pages', count: pages.length },
    { id: 'critical', label: 'Critical Refresh', count: pages.filter(p => p.triageStatus === 'critical').length, color: 'text-destructive' },
    { id: 'review', label: 'Needs Review', count: pages.filter(p => p.triageStatus === 'review').length, color: 'text-warning' },
    { id: 'healthy', label: 'Healthy', count: pages.filter(p => p.triageStatus === 'healthy').length, color: 'text-success' },
  ];

  const dateFilters: { id: DateFilter, label: string }[] = [
    { id: 'all', label: 'Any time' },
    { id: '1m', label: 'Last 1 month' },
    { id: '3m', label: 'Last 3 months' },
    { id: '6m', label: 'Last 6 months' },
    { id: '1y', label: 'Last 1 year' },
    { id: '1.5y', label: 'Last 1.5 years' },
    { id: '2y', label: 'Last 2 years' },
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
      <div className="flex flex-col gap-4">
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

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={14} />
              <select
                value={contentType}
                onChange={(e) => onContentTypeChange(e.target.value as ContentType)}
                className="appearance-none bg-black/40 border border-white/10 rounded-xl pl-8 pr-8 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
              >
                <option value="blog">Blog Posts</option>
                <option value="news">News</option>
                <option value="blog+news">Blog + News</option>
                <option value="all">All Pages</option>
              </select>
            </div>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={14} />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="appearance-none bg-black/40 border border-white/10 rounded-xl pl-8 pr-8 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
              >
                {dateFilters.map(f => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </div>

            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Search URLs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <button
              onClick={() => exportToCsv(filteredPages)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-black/40 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all shrink-0"
              title="Export filtered view as CSV"
            >
              <Download size={14} />
              <span className="hidden md:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selection Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-primary">
                  {selectedIds.size} page{selectedIds.size > 1 ? 's' : ''} selected
                </span>
                {selectedIds.size < filteredPages.length && (
                  <button
                    onClick={selectAllFiltered}
                    className="text-xs text-primary/70 hover:text-primary underline"
                  >
                    Select all {filteredPages.length}
                  </button>
                )}
                <button
                  onClick={clearSelection}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground mr-1">Set status:</span>
                <button
                  onClick={() => handleBatchStatus('queued')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25 transition-colors"
                >
                  <Clock size={12} /> Queued
                </button>
                <button
                  onClick={() => handleBatchStatus('in_progress')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20 hover:bg-amber-500/25 transition-colors"
                >
                  <PlayCircle size={12} /> In Progress
                </button>
                <button
                  onClick={() => handleBatchStatus('refreshed')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 transition-colors"
                >
                  <CheckCircle2 size={12} /> Refreshed
                </button>
                <button
                  onClick={() => handleBatchStatus(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <XCircle size={12} /> Clear Status
                </button>
                <div className="w-px h-5 bg-white/10 mx-1" />
                <button
                  onClick={() => exportToCsv(filteredPages.filter(p => selectedIds.has(p.id)))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <Download size={12} /> Export Selected
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table Container */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-black/20 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="p-4 w-10">
                  <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground transition-colors">
                    {allPageSelected ? (
                      <CheckSquare size={16} className="text-primary" />
                    ) : somePageSelected ? (
                      <MinusSquare size={16} className="text-primary/60" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="p-4 font-medium">
                  <button onClick={() => handleSort('title')} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                    Page URL <SortIcon field="title" />
                  </button>
                </th>
                <th className="p-4 font-medium text-right">
                  <button onClick={() => handleSort('clicks30d')} className="flex items-center gap-1.5 ml-auto hover:text-foreground transition-colors">
                    Traffic (30d) <SortIcon field="clicks30d" />
                  </button>
                </th>
                <th className="p-4 font-medium">
                  <button onClick={() => handleSort('lastUpdated')} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                    Last Updated <SortIcon field="lastUpdated" />
                  </button>
                </th>
                <th className="p-4 font-medium text-center">
                  <button onClick={() => handleSort('priorityScore')} className="flex items-center gap-1.5 mx-auto hover:text-foreground transition-colors">
                    Priority <SortIcon field="priorityScore" />
                  </button>
                </th>
                <th className="p-4 font-medium text-center">
                  <button onClick={() => handleSort('decayScore')} className="flex items-center gap-1.5 mx-auto hover:text-foreground transition-colors">
                    Decay <SortIcon field="decayScore" />
                  </button>
                </th>
                <th className="p-4 font-medium">
                  <button onClick={() => handleSort('triageStatus')} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                    Status <SortIcon field="triageStatus" />
                  </button>
                </th>
                <th className="p-4 font-medium">
                  <button onClick={() => handleSort('aiCitationLikely')} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                    AI Citation <SortIcon field="aiCitationLikely" />
                  </button>
                </th>
                <th className="p-4 font-medium">
                  <button onClick={() => handleSort('semrushVolume')} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                    Keywords <SortIcon field="semrushVolume" />
                  </button>
                </th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {pagedResults.length > 0 ? (
                  pagedResults.map((page, i) => (
                    <React.Fragment key={page.id}>
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      className={cn(
                        "group hover:bg-white/[0.02] transition-colors",
                        page.triageStatus === 'critical' && "bg-destructive/[0.02] hover:bg-destructive/[0.04]",
                        selectedIds.has(page.id) && "bg-primary/[0.04]"
                      )}
                    >
                      <td className="p-4 w-10">
                        <button
                          onClick={() => toggleSelect(page.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {selectedIds.has(page.id) ? (
                            <CheckSquare size={16} className="text-primary" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground font-medium text-sm truncate max-w-[220px]" title={page.title || page.url}>
                              {page.title || 'Untitled Page'}
                            </span>
                            {getWorkflowBadge(page.workflowStatus)}
                          </div>
                          <a
                            href={page.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground text-xs hover:text-primary transition-colors flex items-center gap-1 truncate max-w-[220px]"
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
                          {format(new Date(page.lastUpdated), 'MMM d, yyyy')}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1.5">
                            <Zap size={12} className={cn(
                              page.priorityScore >= 60 ? "text-destructive" :
                              page.priorityScore >= 35 ? "text-warning" :
                              "text-success"
                            )} />
                            <span className={cn(
                              "text-sm font-display font-bold",
                              page.priorityScore >= 60 ? "text-destructive" :
                              page.priorityScore >= 35 ? "text-warning" :
                              "text-foreground"
                            )}>
                              {page.priorityScore}
                            </span>
                          </div>
                          <div className="w-14 h-1 bg-black/50 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                page.priorityScore >= 60 ? "bg-destructive" :
                                page.priorityScore >= 35 ? "bg-warning" :
                                "bg-success"
                              )}
                              style={{ width: `${page.priorityScore}%` }}
                            />
                          </div>
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
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 w-max" title={page.aiCitationReason ?? ''}>
                            <BrainCircuit size={14} className="animate-pulse" />
                            <span className="text-xs font-semibold">Likely</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-muted-foreground w-max" title={page.aiCitationReason ?? ''}>
                            <BrainCircuit size={14} className="opacity-50" />
                            <span className="text-xs font-medium">Unlikely</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {page.semrushKeywords != null ? (
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => toggleKeywords(page.id)}
                              className="flex items-center gap-1.5 hover:bg-white/5 rounded-md px-1.5 py-0.5 -mx-1.5 transition-colors text-left"
                            >
                              <span className="text-sm font-semibold text-foreground">{page.semrushKeywords}</span>
                              <span className="text-xs text-muted-foreground">kw</span>
                              <span className="text-xs text-muted-foreground mx-0.5">·</span>
                              <span className="text-xs text-muted-foreground">{(page.semrushVolume ?? 0).toLocaleString()} vol</span>
                              {expandedKeywords.has(page.id) ? (
                                <ChevronUpIcon size={12} className="text-muted-foreground ml-auto" />
                              ) : (
                                <ChevronDown size={12} className="text-muted-foreground ml-auto" />
                              )}
                            </button>
                            <AnimatePresence>
                              {expandedKeywords.has(page.id) && page.semrushKeywordList && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="flex flex-col gap-0.5 pt-1 border-t border-white/5 mt-0.5 max-h-[200px] overflow-y-auto">
                                    {page.semrushKeywordList.map((kw, idx) => (
                                      <div key={idx} className="flex items-center gap-2 text-xs py-0.5 group/kw">
                                        <span className="text-foreground/80 truncate max-w-[140px] flex-1" title={kw.keyword}>{kw.keyword}</span>
                                        <span className="text-muted-foreground shrink-0">{kw.volume.toLocaleString()}</span>
                                        <span className={cn(
                                          "shrink-0 font-mono text-[10px] px-1 rounded",
                                          kw.position <= 3 ? "text-success bg-success/10" :
                                          kw.position <= 10 ? "text-blue-400 bg-blue-400/10" :
                                          kw.position <= 20 ? "text-warning bg-warning/10" :
                                          "text-muted-foreground bg-white/5"
                                        )}>#{kw.position}</span>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setExpandedRecs(prev => {
                                const next = new Set(prev);
                                if (next.has(page.id)) next.delete(page.id); else next.add(page.id);
                                return next;
                              });
                            }}
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              expandedRecs.has(page.id)
                                ? "text-amber-400 bg-amber-400/10"
                                : "text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10 opacity-0 group-hover:opacity-100"
                            )}
                            title="View recommendations"
                          >
                            <Lightbulb size={16} />
                          </button>
                          <button
                            onClick={() => deletePage.mutate({ id: page.id })}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove from tracking"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                    <AnimatePresence>
                      {expandedRecs.has(page.id) && page.refreshRecommendations.length > 0 && (
                        <motion.tr
                          key={`recs-${page.id}`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="bg-amber-500/[0.03] border-b border-amber-500/10"
                        >
                          <td colSpan={10} className="px-6 py-3">
                            <div className="flex items-start gap-3">
                              <div className="flex items-center gap-2 shrink-0 pt-0.5">
                                <Lightbulb size={14} className="text-amber-400" />
                                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Action Items</span>
                              </div>
                              <div className="flex flex-col gap-1.5 flex-1">
                                {page.refreshRecommendations.map((rec, idx) => (
                                  <div key={idx} className="flex items-start gap-2 text-sm">
                                    <span className="text-amber-400/60 shrink-0 font-mono text-xs mt-0.5">{idx + 1}.</span>
                                    <span className="text-foreground/80">{rec}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                    </React.Fragment>
                  ))
                ) : (
                  <tr className="border-none">
                    <td colSpan={10} className="p-12 text-center">
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

        {/* Pagination */}
        {filteredPages.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <p className="text-xs text-muted-foreground">
              Showing <span className="text-foreground font-medium">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredPages.length)}</span> of <span className="text-foreground font-medium">{filteredPages.length}</span> pages
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (arr[idx - 1] as number) < p - 1) acc.push('…');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === '…' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground text-sm">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item as number)}
                      className={cn(
                        "w-8 h-8 rounded-lg text-sm font-medium transition-all",
                        currentPage === item
                          ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      )}
                    >
                      {item}
                    </button>
                  )
                )}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
