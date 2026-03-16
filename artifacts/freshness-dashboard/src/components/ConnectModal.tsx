import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Settings, Globe, RefreshCw, CheckCircle2, AlertCircle,
  Loader2, ChevronDown, ChevronUp, ExternalLink, Key, Wifi, WifiOff
} from 'lucide-react';
import { useSettings, useSyncActions } from '@/hooks/use-sync';
import { cn } from '@/lib/utils';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectModal({ isOpen, onClose }: ConnectModalProps) {
  const { settings, syncStatus } = useSettings();
  const { updateSettings, syncSitemap, syncGsc } = useSyncActions();

  const [sitemapUrl, setSitemapUrl] = useState("");
  const [gscSiteUrl, setGscSiteUrl] = useState("");
  const [gscJson, setGscJson] = useState("");
  const [showGscInstructions, setShowGscInstructions] = useState(false);
  const [showJsonInput, setShowJsonInput] = useState(false);

  // Pre-fill form from loaded settings
  useEffect(() => {
    if (settings) {
      setSitemapUrl(settings.sitemapUrl ?? "");
      setGscSiteUrl(settings.gscSiteUrl ?? "");
    }
  }, [settings]);

  const handleSaveSitemap = () => {
    updateSettings.mutate({ data: { sitemapUrl } });
  };

  const handleSaveGsc = () => {
    const payload: any = { gscSiteUrl };
    if (gscJson.trim()) payload.gscServiceAccountJson = gscJson.trim();
    updateSettings.mutate({ data: payload });
    setGscJson("");
    setShowJsonInput(false);
  };

  const handleSyncSitemap = () => syncSitemap.mutate({});
  const handleSyncGsc = () => syncGsc.mutate({});

  const formatDate = (d: any) => {
    if (!d) return null;
    try { return new Date(d).toLocaleString(); } catch { return null; }
  };

  const sitemapConfigured = syncStatus?.sitemapConfigured ?? !!settings?.sitemapUrl;
  const gscConfigured = syncStatus?.gscConfigured ?? settings?.gscHasCredentials;

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
            <div className="glass-panel rounded-2xl p-6 shadow-2xl flex flex-col gap-6">

              {/* Header */}
              <div className="flex justify-between items-center border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Settings size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-semibold text-foreground">Connect & Auto-Sync</h2>
                    <p className="text-sm text-muted-foreground">Connect your site to track pages live — no manual exports needed.</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* ── Sitemap Section ── */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe size={18} className="text-primary" />
                    <h3 className="font-semibold text-foreground">Sitemap Sync</h3>
                    <span className="text-xs text-muted-foreground">— auto-discovers pages + last-modified dates</span>
                  </div>
                  <StatusBadge configured={sitemapConfigured} />
                </div>

                <div className="bg-black/20 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                  <label className="text-sm font-medium text-foreground">Sitemap URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={sitemapUrl}
                      onChange={(e) => setSitemapUrl(e.target.value)}
                      placeholder="https://yoursite.com/sitemap.xml"
                      className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    />
                    <button
                      onClick={handleSaveSitemap}
                      disabled={updateSettings.isPending}
                      className="px-4 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-sm font-medium transition-all disabled:opacity-50 border border-primary/30"
                    >
                      Save
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supports sitemap index files. Try <code className="bg-white/10 px-1 rounded">/sitemap.xml</code> or <code className="bg-white/10 px-1 rounded">/sitemap_index.xml</code>
                  </p>

                  {syncStatus?.lastSitemapSync && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-green-400" />
                      Last synced: {formatDate(syncStatus.lastSitemapSync)}
                    </p>
                  )}

                  <button
                    onClick={handleSyncSitemap}
                    disabled={!sitemapConfigured || syncSitemap.isPending}
                    className={cn(
                      "flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold transition-all",
                      sitemapConfigured
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(99,102,241,0.25)]"
                        : "bg-white/5 text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    {syncSitemap.isPending ? (
                      <><Loader2 size={16} className="animate-spin" /> Syncing sitemap...</>
                    ) : (
                      <><RefreshCw size={16} /> Sync Now</>
                    )}
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">+ enriched with</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* ── GSC Section ── */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key size={18} className="text-indigo-400" />
                    <h3 className="font-semibold text-foreground">Google Search Console</h3>
                    <span className="text-xs text-muted-foreground">— pulls live click &amp; traffic data</span>
                  </div>
                  <StatusBadge configured={!!gscConfigured} />
                </div>

                <div className="bg-black/20 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                  {/* Instructions toggle */}
                  <button
                    onClick={() => setShowGscInstructions(!showGscInstructions)}
                    className="flex items-center justify-between text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    <span className="font-medium">How to connect Google Search Console →</span>
                    {showGscInstructions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {showGscInstructions && (
                    <ol className="space-y-2 text-sm text-muted-foreground border-t border-white/5 pt-3">
                      <li className="flex gap-2"><span className="text-primary font-semibold shrink-0">1.</span><span>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">console.cloud.google.com</a> → Create a new project (free)</span></li>
                      <li className="flex gap-2"><span className="text-primary font-semibold shrink-0">2.</span><span>Search for <strong className="text-foreground">Google Search Console API</strong> and click <strong className="text-foreground">Enable</strong></span></li>
                      <li className="flex gap-2"><span className="text-primary font-semibold shrink-0">3.</span><span>Go to <strong className="text-foreground">IAM &amp; Admin → Service Accounts</strong> → Create service account</span></li>
                      <li className="flex gap-2"><span className="text-primary font-semibold shrink-0">4.</span><span>Click the service account → <strong className="text-foreground">Keys → Add Key → JSON</strong> → Download the file</span></li>
                      <li className="flex gap-2"><span className="text-primary font-semibold shrink-0">5.</span><span>In <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Search Console</a>, go to <strong className="text-foreground">Settings → Users and permissions</strong> → Add the service account email as <strong className="text-foreground">Full user</strong></span></li>
                      <li className="flex gap-2"><span className="text-primary font-semibold shrink-0">6.</span><span>Paste the downloaded JSON key and your site URL below</span></li>
                    </ol>
                  )}

                  {/* GSC Site URL */}
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Site URL (as it appears in GSC)</label>
                    <input
                      type="url"
                      value={gscSiteUrl}
                      onChange={(e) => setGscSiteUrl(e.target.value)}
                      placeholder="https://www.yoursite.com/"
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Must exactly match the property URL in Search Console (including https:// and trailing slash)</p>
                  </div>

                  {/* Service Account JSON */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium text-foreground">
                        Service Account Key {settings?.gscHasCredentials && <span className="text-green-400 text-xs ml-1">(saved ✓)</span>}
                      </label>
                      <button
                        onClick={() => setShowJsonInput(!showJsonInput)}
                        className="text-xs text-primary hover:underline"
                      >
                        {showJsonInput ? "Cancel" : settings?.gscHasCredentials ? "Replace key" : "Paste JSON key"}
                      </button>
                    </div>

                    {showJsonInput && (
                      <textarea
                        value={gscJson}
                        onChange={(e) => setGscJson(e.target.value)}
                        placeholder={'{\n  "type": "service_account",\n  "project_id": "...",\n  ...\n}'}
                        rows={6}
                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-foreground/80 placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none"
                      />
                    )}
                  </div>

                  <button
                    onClick={handleSaveGsc}
                    disabled={updateSettings.isPending || (!gscSiteUrl && !gscJson)}
                    className="px-4 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-sm font-medium transition-all disabled:opacity-50 border border-primary/30 w-fit"
                  >
                    {updateSettings.isPending ? "Saving..." : "Save GSC Settings"}
                  </button>

                  {syncStatus?.lastGscSync && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-green-400" />
                      Last synced: {formatDate(syncStatus.lastGscSync)}
                    </p>
                  )}

                  <button
                    onClick={handleSyncGsc}
                    disabled={!gscConfigured || syncGsc.isPending}
                    className={cn(
                      "flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold transition-all",
                      gscConfigured
                        ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.25)]"
                        : "bg-white/5 text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    {syncGsc.isPending ? (
                      <><Loader2 size={16} className="animate-spin" /> Pulling GSC data...</>
                    ) : (
                      <><RefreshCw size={16} /> Pull Traffic Data Now</>
                    )}
                  </button>
                </div>
              </div>

              {/* Footer note */}
              <p className="text-xs text-muted-foreground text-center border-t border-border pt-4">
                Sync runs on-demand. Click "Sync Now" to refresh data anytime.
              </p>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StatusBadge({ configured }: { configured: boolean }) {
  return configured ? (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
      <Wifi size={10} /> Connected
    </span>
  ) : (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground text-xs font-medium">
      <WifiOff size={10} /> Not set up
    </span>
  );
}
