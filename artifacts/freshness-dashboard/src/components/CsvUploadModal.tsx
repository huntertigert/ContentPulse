import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileType, ChevronDown, ChevronUp, FileText, CheckCircle2 } from 'lucide-react';
import { useDashboardMutations } from '@/hooks/use-dashboard';
import { cn } from '@/lib/utils';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SourceTab = 'gsc' | 'wordpress' | 'ga' | 'manual';

const SOURCES: { id: SourceTab; label: string; emoji: string }[] = [
  { id: 'gsc', label: 'Google Search Console', emoji: '🔍' },
  { id: 'wordpress', label: 'WordPress', emoji: '🟦' },
  { id: 'ga', label: 'Google Analytics', emoji: '📊' },
  { id: 'manual', label: 'Manual / Custom', emoji: '📄' },
];

const SOURCE_INSTRUCTIONS: Record<SourceTab, React.ReactNode> = {
  gsc: (
    <ol className="space-y-2 text-sm text-muted-foreground list-none">
      <li className="flex gap-2"><span className="text-primary font-semibold shrink-0">1.</span><span>Go to <strong className="text-foreground">search.google.com/search-console</strong></span></li>
      <li className="flex gap-2"><span className="text-primary font-semibold shrink-0">2.</span><span>Click <strong className="text-foreground">Performance → Search Results</strong></span></li>
      <li className="flex gap-2"><span className="text-primary font-semibold shrink-0">3.</span><span>Set date range to <strong className="text-foreground">Last 28 days</strong></span></li>
      <li className="flex gap-2"><span className="text-primary font-semibold shrink-0">4.</span><span>Click the <strong className="text-foreground">Pages</strong> tab below the chart</span></li>
      <li className="flex gap-2"><span className="text-primary font-semibold shrink-0">5.</span><span>Click <strong className="text-foreground">↓ Export → Download CSV</strong>, then upload it below</span></li>
    </ol>
  ),
  wordpress: (
    <ol className="space-y-2 text-sm text-muted-foreground list-none">
      <li className="flex gap-2"><span className="text-primary font-semibold shrink-0">1.</span><span>Install the free <strong className="text-foreground">WP All Export</strong> plugin</span></li>
      <li className="flex gap-2"><span className="text-primary font-semibold shrink-0">2.</span><span>Export <strong className="text-foreground">Posts / Pages</strong> with: Permalink, Title, Post Modified Date, Post Excerpt</span></li>
      <li className="flex gap-2"><span className="text-primary font-semibold shrink-0">3.</span><span>Export as CSV and upload the file below — URL and date columns are auto-detected</span></li>
      <li className="flex gap-2 text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 mt-1">
        <span>💡</span>
        <span>Tip: Import WordPress data first for dates, then import a Google Search Console CSV to add click data.</span>
      </li>
    </ol>
  ),
  ga: (
    <ol className="space-y-2 text-sm text-muted-foreground list-none">
      <li className="flex gap-2"><span className="text-primary font-semibold shrink-0">1.</span><span>Go to <strong className="text-foreground">analytics.google.com</strong></span></li>
      <li className="flex gap-2"><span className="text-primary font-semibold shrink-0">2.</span><span>Open <strong className="text-foreground">Reports → Engagement → Pages and screens</strong></span></li>
      <li className="flex gap-2"><span className="text-primary font-semibold shrink-0">3.</span><span>Set date to <strong className="text-foreground">Last 30 days</strong>, click <strong className="text-foreground">↓ Download CSV</strong></span></li>
      <li className="flex gap-2"><span className="text-primary font-semibold shrink-0">4.</span><span>Upload the file below — <code className="text-xs bg-white/10 px-1 rounded">Page path</code> → URL, <code className="text-xs bg-white/10 px-1 rounded">Sessions</code> → traffic</span></li>
    </ol>
  ),
  manual: (
    <div className="space-y-3 text-sm text-muted-foreground">
      <p>Only <strong className="text-foreground">URL</strong> is required. All other columns are optional.</p>
      <div className="bg-black/30 rounded-lg p-3 font-mono text-xs text-foreground/80 overflow-x-auto">
        <div className="text-muted-foreground mb-1"># Minimal:</div>
        <div>url</div>
        <div>/blog/my-post</div>
        <br />
        <div className="text-muted-foreground mb-1"># Full:</div>
        <div>url,title,lastUpdated,clicks,wordCount</div>
        <div>/blog/seo-guide,SEO Guide,2025-12-01,850,1200</div>
      </div>
      <p className="text-xs">Accepted names: <code className="bg-white/10 px-1 rounded">url/page/permalink</code> · <code className="bg-white/10 px-1 rounded">title/name</code> · <code className="bg-white/10 px-1 rounded">lastUpdated/modified/date</code> · <code className="bg-white/10 px-1 rounded">clicks/pageviews/sessions</code> · <code className="bg-white/10 px-1 rounded">wordCount/words</code></p>
    </div>
  ),
};

export function CsvUploadModal({ isOpen, onClose }: CsvUploadModalProps) {
  const [csvData, setCsvData] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeSource, setActiveSource] = useState<SourceTab>('gsc');
  const [showInstructions, setShowInstructions] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadCsv } = useDashboardMutations();

  const readFile = (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'text/plain') {
      alert('Please upload a .csv file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvData(text);
      setFileName(file.name);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleClear = () => {
    setCsvData("");
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = () => {
    if (!csvData.trim()) return;
    uploadCsv.mutate({ data: { csvData } }, {
      onSuccess: () => {
        handleClear();
        onClose();
      }
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
                    <h2 className="text-xl font-display font-semibold text-foreground">Import Page Data</h2>
                    <p className="text-sm text-muted-foreground">Upload a CSV file or paste content directly.</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Source Tabs */}
              <div className="flex flex-wrap gap-2">
                {SOURCES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setActiveSource(s.id); setShowInstructions(true); }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      activeSource === s.id
                        ? "bg-primary/20 text-primary border border-primary/40"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <span>{s.emoji}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>

              {/* Instructions Panel */}
              <div className="bg-black/30 border border-white/5 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-white/5 transition-colors"
                >
                  <span>How to export from {SOURCES.find(s => s.id === activeSource)?.label}</span>
                  {showInstructions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showInstructions && (
                  <div className="px-4 pb-4 pt-1 border-t border-white/5">
                    {SOURCE_INSTRUCTIONS[activeSource]}
                  </div>
                )}
              </div>

              {/* File Upload Zone */}
              {!csvData ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 h-40 rounded-xl border-2 border-dashed cursor-pointer transition-all",
                    isDragging
                      ? "border-primary bg-primary/10 scale-[1.01]"
                      : "border-white/10 bg-black/20 hover:border-primary/50 hover:bg-primary/5"
                  )}
                >
                  <div className={cn("p-3 rounded-full transition-colors", isDragging ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground")}>
                    <Upload size={24} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Drop your CSV file here, or <span className="text-primary underline underline-offset-2">browse</span></p>
                    <p className="text-xs text-muted-foreground mt-1">Supports .csv files from GSC, WordPress, GA, and more</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* File loaded indicator */}
                  {fileName && (
                    <div className="flex items-center justify-between px-4 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl">
                      <div className="flex items-center gap-2 text-sm text-green-400">
                        <CheckCircle2 size={16} />
                        <FileText size={15} />
                        <span className="font-medium">{fileName}</span>
                        <span className="text-green-500/60">— {csvData.split('\n').length - 1} rows detected</span>
                      </div>
                      <button onClick={handleClear} className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-white/5">
                        Change file
                      </button>
                    </div>
                  )}

                  {/* Preview / paste area */}
                  <div className="relative">
                    <textarea
                      value={csvData}
                      onChange={(e) => { setCsvData(e.target.value); setFileName(null); }}
                      className={cn(
                        "w-full h-36 p-4 rounded-xl font-mono text-xs",
                        "bg-black/40 border border-white/10",
                        "text-foreground/70",
                        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
                        "transition-all resize-none"
                      )}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">You can edit the content above before importing.</p>
                </div>
              )}

              {/* Paste toggle when no file loaded */}
              {!csvData && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Prefer to paste?{' '}
                    <button
                      onClick={() => { setCsvData(" "); setTimeout(() => setCsvData(""), 0); }}
                      className="text-primary underline underline-offset-2 hover:no-underline"
                    >
                      Click here to type or paste CSV
                    </button>
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-foreground hover:bg-white/5 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!csvData.trim() || uploadCsv.isPending}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all duration-200",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  )}
                >
                  {uploadCsv.isPending ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>
                  ) : (
                    <><Upload size={18} />Import Data</>
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
