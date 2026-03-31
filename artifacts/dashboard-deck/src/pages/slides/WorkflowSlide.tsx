export default function WorkflowSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="absolute inset-0 opacity-15 [background:radial-gradient(circle_at_50%_80%,rgba(99,102,241,0.4),transparent_55%)]" />
      <div className="relative flex h-full flex-col px-[7vw] py-[7vh]">
        <div className="flex items-center gap-[0.8vw] mb-[2vh]">
          <div className="w-[2.5vw] h-[3px] bg-primary rounded-full" />
          <span className="text-[1.3vw] font-body tracking-[0.12em] text-primary uppercase">
            Workflow
          </span>
        </div>
        <h2 className="text-[3.8vw] leading-[1.05] font-display font-bold tracking-tight text-text mb-[5vh]">
          From data to action
        </h2>
        <div className="flex-1 flex items-center">
          <div className="flex items-start gap-[1.5vw] w-full">
            <div className="flex-1 flex flex-col items-center gap-[1.5vh]">
              <div className="w-[5vw] h-[5vw] rounded-full bg-primary/15 border-2 border-primary/40 flex items-center justify-center">
                <span className="text-[2vw] font-display font-bold text-primary">1</span>
              </div>
              <span className="text-[1.5vw] font-display font-bold text-text text-center">Import</span>
              <span className="text-[1.1vw] font-body text-muted text-center leading-relaxed max-w-[14vw]">CSV upload, sitemap crawl, or Google Search Console API sync</span>
            </div>
            <div className="mt-[2.5vw] w-[4vw] h-px bg-gradient-to-r from-primary/40 to-accent/40" />
            <div className="flex-1 flex flex-col items-center gap-[1.5vh]">
              <div className="w-[5vw] h-[5vw] rounded-full bg-accent/15 border-2 border-accent/40 flex items-center justify-center">
                <span className="text-[2vw] font-display font-bold text-accent">2</span>
              </div>
              <span className="text-[1.5vw] font-display font-bold text-text text-center">Analyze</span>
              <span className="text-[1.1vw] font-body text-muted text-center leading-relaxed max-w-[14vw]">Decay scoring, AI citation prediction, priority ranking, keyword enrichment</span>
            </div>
            <div className="mt-[2.5vw] w-[4vw] h-px bg-gradient-to-r from-accent/40 to-warning/40" />
            <div className="flex-1 flex flex-col items-center gap-[1.5vh]">
              <div className="w-[5vw] h-[5vw] rounded-full bg-warning/15 border-2 border-warning/40 flex items-center justify-center">
                <span className="text-[2vw] font-display font-bold text-warning">3</span>
              </div>
              <span className="text-[1.5vw] font-display font-bold text-text text-center">Triage</span>
              <span className="text-[1.1vw] font-body text-muted text-center leading-relaxed max-w-[14vw]">Filter by status, sort by priority, review recommendations per page</span>
            </div>
            <div className="mt-[2.5vw] w-[4vw] h-px bg-gradient-to-r from-warning/40 to-healthy/40" />
            <div className="flex-1 flex flex-col items-center gap-[1.5vh]">
              <div className="w-[5vw] h-[5vw] rounded-full bg-healthy/15 border-2 border-healthy/40 flex items-center justify-center">
                <span className="text-[2vw] font-display font-bold text-healthy">4</span>
              </div>
              <span className="text-[1.5vw] font-display font-bold text-text text-center">Execute</span>
              <span className="text-[1.1vw] font-body text-muted text-center leading-relaxed max-w-[14vw]">Batch assign workflow status, track progress, export reports as CSV</span>
            </div>
          </div>
        </div>
        <div className="flex gap-[2vw] mt-[3vh]">
          <div className="flex items-center gap-[0.6vw] px-[1.2vw] py-[0.6vw] rounded-[0.5vw] bg-surface/60 border border-white/5">
            <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-blue-400" />
            <span className="text-[1.1vw] font-body text-muted">Queued</span>
          </div>
          <div className="flex items-center gap-[0.6vw] px-[1.2vw] py-[0.6vw] rounded-[0.5vw] bg-surface/60 border border-white/5">
            <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-warning" />
            <span className="text-[1.1vw] font-body text-muted">In Progress</span>
          </div>
          <div className="flex items-center gap-[0.6vw] px-[1.2vw] py-[0.6vw] rounded-[0.5vw] bg-surface/60 border border-white/5">
            <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-healthy" />
            <span className="text-[1.1vw] font-body text-muted">Refreshed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
