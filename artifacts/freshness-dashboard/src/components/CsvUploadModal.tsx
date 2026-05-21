import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileType, ChevronDown, ChevronUp, FileText, CheckCircle2, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useMonthlyRefresh, getGetPagesQueryKey, getGetStatsQueryKey } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Slot = 'semrush' | 'gsc';

interface FileSlot {
  csvData: string;
  fileName: string | null;
}

const SLOT_META: Record<Slot, { title: string; emoji: string; instructions: React.ReactNode }> = {
  semrush: {
    title: 'SEMrush CSV',
    emoji: '📈',
    instructions: (
      <ol className="space-y-2 text-sm text-muted-foreground list-none">
        <li className="flex gap-2"><span className="text-primary font-semibold shrink-0">1.</span><span>Go to <strong className="text-foreground">SEMrush → Organic Research → Positions</strong></span></li>
        <li className="flex gap-2"><span className="text-primary font-semibold shrink-0">2.</span><span>Enter your domain and click <strong className="text-foreground">Search</strong></span></li>
        <li className="flex gap-2"><span className="text-primary font-semibold shrink-0">3.</span><span>Click <strong className="text-foreground">Export → CSV</strong> in the top right of the keyword table</span></li>
        <li className="flex gap-2 text-xs bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-2 mt-1">
          <span>💡</span>
          <span>Expected columns: <code className="bg-white/10 px-1 rounded">Keyword</code>, <code className="bg-white/10 px-1 rounded">Position</code>, <code className="bg-white/10 px-1 rounded">Search Volume</code>, <code className="bg-white/10 px-1 rounded">URL</code>, <code className="bg-white/10 px-1 rounded">Keyword Difficulty</code></span>
        </li>
      </ol>
    ),
  },
  gsc: {
    title: 'Google Search Console CSV',
    emoji: '🔍',
    instructions: (
      <ol className="space-y-2 text-sm text-muted-foreground list-none">
        <li className="flex gap-2"><span className="text-primary font-semibold shrink-0">1.</span><span>Go to <strong className="text-foreground">search.google.com/search-console</strong></span></li>
        <li className="flex gap-2"><span className="text-primary font-semibold shrink-0">2.</span><span>Click <strong className="text-foreground">Performance → Search Results</strong></span></li>
        <li className="flex gap-2"><span className="text-primary font-semibold shrink-0">3.</span><span>Set the date range to <strong className="text-foreground">Last 28 days</strong> (or whatever monthly window you prefer)</span></li>
        <li className="flex gap-2"><span className="text-primary font-semibold shrink-0">4.</span><span>Click the <strong className="text-foreground">Pages</strong> tab under the chart</span></li>
        <li className="flex gap-2"><span className="text-primary font-semibold shrink-0">5.</span><span>Click <strong className="text-foreground">↓ Export → Download CSV</strong> and drop the <code className="bg-white/10 px-1 rounded">Pages.csv</code> file below (the export is a .zip — unzip it first)</span></li>
      </ol>
    ),
  },
};

interface FileDropZoneProps {
  slot: Slot;
  file: FileSlot;
  onFile: (csv: string, name: string) => void;
  onClear: () => void;
}

function FileDropZone({ slot, file, onFile, onClear }: FileDropZoneProps) {
  const meta = SLOT_META[slot];
  const [isDragging, setIsDragging] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith('.csv') && f.type !== 'text/csv' && f.type !== 'text/plain') {
      alert('Please upload a .csv file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => onFile(e.target?.result as string, f.name);
    reader.readAsText(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) readFile(f);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span>{meta.emoji}</span>
          <span>{meta.title}</span>
        </div>
        <button
          type="button"
          onClick={() => setShowInstructions(v => !v)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          {showInstructions ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          How to export
        </button>
      </div>

      {showInstructions && (
        <div className="bg-black/30 border border-white/5 rounded-xl px-4 py-3">
          {meta.instructions}
        </div>
      )}

      {!file.csvData ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-2 h-28 rounded-xl border-2 border-dashed cursor-pointer transition-all",
            isDragging
              ? "border-primary bg-primary/10"
              : "border-white/10 bg-black/20 hover:border-primary/50 hover:bg-primary/5"
          )}
        >
          <Upload size={18} className={isDragging ? 'text-primary' : 'text-muted-foreground'} />
          <p className="text-xs text-muted-foreground">
            Drop {meta.title} here, or <span className="text-primary underline underline-offset-2">browse</span>
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); }}
            className="hidden"
          />
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-green-400 min-w-0">
            <CheckCircle2 size={16} className="shrink-0" />
            <FileText size={15} className="shrink-0" />
            <span className="font-medium truncate">{file.fileName}</span>
            <span className="text-green-500/60 text-xs shrink-0">— {file.csvData.split('\n').length - 1} rows</span>
          </div>
          <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-white/5 shrink-0">
            Change
          </button>
        </div>
      )}
    </div>
  );
}

export function CsvUploadModal({ isOpen, onClose }: CsvUploadModalProps) {
  const [semrush, setSemrush] = useState<FileSlot>({ csvData: '', fileName: null });
  const [gsc, setGsc] = useState<FileSlot>({ csvData: '', fileName: null });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const monthlyRefresh = useMonthlyRefresh({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetPagesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        toast({
          title: data.success ? 'Monthly Refresh Complete' : 'Refresh Finished With Issues',
          description: data.message,
          variant: data.success ? 'default' : 'destructive',
        });
        setSemrush({ csvData: '', fileName: null });
        setGsc({ csvData: '', fileName: null });
        onClose();
      },
      onError: (err: any) => {
        toast({
          title: 'Refresh Failed',
          description: err?.message || 'The monthly refresh could not complete.',
          variant: 'destructive',
        });
      },
    },
  });

  const canSubmit = (semrush.csvData.trim() || gsc.csvData.trim()) && !monthlyRefresh.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    monthlyRefresh.mutate({
      data: {
        semrushCsv: semrush.csvData || undefined,
        gscCsv: gsc.csvData || undefined,
      },
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50 max-h-[90vh] overflow-y-auto"
          >
            <div className="glass-panel rounded-2xl p-6 shadow-2xl flex flex-col gap-5">

              {/* Header */}
              <div className="flex justify-between items-center border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <FileType size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-semibold text-foreground">Monthly Refresh</h2>
                    <p className="text-sm text-muted-foreground">
                      Upload this month's SEMrush and GSC exports. The sitemap will be re-crawled automatically.
                    </p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Pipeline preview */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-black/20 rounded-lg px-3 py-2 border border-white/5">
                <span className="text-primary">①</span> Crawl sitemap (new posts + lastmod dates)
                <span className="text-white/20">→</span>
                <span className="text-primary">②</span> Parse SEMrush keywords
                <span className="text-white/20">→</span>
                <span className="text-primary">③</span> Parse GSC clicks/impressions
                <span className="text-white/20">→</span>
                <span className="text-primary">④</span> Recompute scores
              </div>

              {/* File slots */}
              <div className="flex flex-col gap-4">
                <FileDropZone
                  slot="semrush"
                  file={semrush}
                  onFile={(csvData, fileName) => setSemrush({ csvData, fileName })}
                  onClear={() => setSemrush({ csvData: '', fileName: null })}
                />
                <FileDropZone
                  slot="gsc"
                  file={gsc}
                  onFile={(csvData, fileName) => setGsc({ csvData, fileName })}
                  onClear={() => setGsc({ csvData: '', fileName: null })}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Both files are optional but at least one is required. The sitemap crawl always runs.
                Expect this to take 2–10 minutes depending on how many new posts need scraping.
              </p>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <button
                  onClick={onClose}
                  disabled={monthlyRefresh.isPending}
                  className="px-5 py-2.5 rounded-xl font-medium text-foreground hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all duration-200",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  )}
                >
                  {monthlyRefresh.isPending ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Refreshing…</>
                  ) : (
                    <><RefreshCw size={18} />Run Monthly Refresh</>
                  )}
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
