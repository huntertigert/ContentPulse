import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileType } from 'lucide-react';
import { useDashboardMutations } from '@/hooks/use-dashboard';
import { cn } from '@/lib/utils';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CsvUploadModal({ isOpen, onClose }: CsvUploadModalProps) {
  const [csvData, setCsvData] = useState("");
  const { uploadCsv } = useDashboardMutations();

  const handleUpload = async () => {
    if (!csvData.trim()) return;
    
    uploadCsv.mutate({ data: { csvData } }, {
      onSuccess: () => {
        setCsvData("");
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50"
          >
            <div className="glass-panel rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <FileType size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-semibold text-foreground">Import Source Data</h2>
                    <p className="text-sm text-muted-foreground">Paste your Google Search Console or CMS CSV export here.</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-foreground">CSV Content</label>
                <div className="relative">
                  <textarea
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    placeholder="url,title,lastUpdated,clicks30d,clicksPrev30d,wordCount,excerpt..."
                    className={cn(
                      "w-full h-64 p-4 rounded-xl font-mono text-sm",
                      "bg-black/40 border border-white/10",
                      "text-foreground placeholder:text-muted-foreground/50",
                      "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
                      "transition-all resize-none"
                    )}
                  />
                  {!csvData && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-muted-foreground/40">
                      <Upload size={32} className="mb-2" />
                      <p>Paste CSV data here</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  Ensure headers match expected format for accurate mapping.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl font-medium text-foreground hover:bg-white/5 transition-colors"
                >
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
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Import Data
                    </>
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
