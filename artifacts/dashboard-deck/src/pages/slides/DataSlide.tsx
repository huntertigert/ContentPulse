export default function DataSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="absolute inset-0 opacity-15 [background:radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.3),transparent_50%)]" />
      <div className="relative flex h-full px-[7vw] py-[7vh]">
        <div className="flex flex-col w-[45vw] pr-[4vw]">
          <div className="flex items-center gap-[0.8vw] mb-[2vh]">
            <div className="w-[2.5vw] h-[3px] bg-accent rounded-full" />
            <span className="text-[1.3vw] font-body tracking-[0.12em] text-accent uppercase">
              Data Sources
            </span>
          </div>
          <h2 className="text-[3.8vw] leading-[1.05] font-display font-bold tracking-tight text-text mb-[4vh]">
            Connect your stack
          </h2>
          <div className="flex flex-col gap-[2vh]">
            <div className="flex items-start gap-[1vw] p-[1.5vw] rounded-[0.8vw] bg-surface/50 border border-white/5">
              <div className="w-[2.5vw] h-[2.5vw] rounded-[0.4vw] bg-primary/15 flex items-center justify-center shrink-0">
                <span className="text-[1.1vw] font-display font-bold text-primary">GSC</span>
              </div>
              <div className="flex flex-col gap-[0.3vh]">
                <span className="text-[1.4vw] font-display font-bold text-text">Google Search Console</span>
                <span className="text-[1.1vw] font-body text-muted">Live API sync for clicks, impressions, and traffic trends</span>
              </div>
            </div>
            <div className="flex items-start gap-[1vw] p-[1.5vw] rounded-[0.8vw] bg-surface/50 border border-white/5">
              <div className="w-[2.5vw] h-[2.5vw] rounded-[0.4vw] bg-critical/15 flex items-center justify-center shrink-0">
                <span className="text-[1.1vw] font-display font-bold text-critical">SR</span>
              </div>
              <div className="flex flex-col gap-[0.3vh]">
                <span className="text-[1.4vw] font-display font-bold text-text">SEMrush</span>
                <span className="text-[1.1vw] font-body text-muted">Keyword positions, search volume, and difficulty via CSV</span>
              </div>
            </div>
            <div className="flex items-start gap-[1vw] p-[1.5vw] rounded-[0.8vw] bg-surface/50 border border-white/5">
              <div className="w-[2.5vw] h-[2.5vw] rounded-[0.4vw] bg-accent/15 flex items-center justify-center shrink-0">
                <span className="text-[1.1vw] font-display font-bold text-accent">CSV</span>
              </div>
              <div className="flex flex-col gap-[0.3vh]">
                <span className="text-[1.4vw] font-display font-bold text-text">CSV Upload</span>
                <span className="text-[1.1vw] font-body text-muted">WordPress, GA, or custom data in flexible CSV format</span>
              </div>
            </div>
            <div className="flex items-start gap-[1vw] p-[1.5vw] rounded-[0.8vw] bg-surface/50 border border-white/5">
              <div className="w-[2.5vw] h-[2.5vw] rounded-[0.4vw] bg-healthy/15 flex items-center justify-center shrink-0">
                <span className="text-[1.1vw] font-display font-bold text-healthy">XML</span>
              </div>
              <div className="flex flex-col gap-[0.3vh]">
                <span className="text-[1.4vw] font-display font-bold text-text">Sitemap Crawl</span>
                <span className="text-[1.1vw] font-body text-muted">Auto-discover and import pages from your XML sitemap</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center gap-[3vh] pl-[3vw] border-l border-white/5">
          <div className="flex flex-col gap-[0.5vh]">
            <span className="text-[1.2vw] font-body text-muted uppercase tracking-wider">Priority Score Formula</span>
            <div className="flex flex-col gap-[1vh] mt-[1vh]">
              <div className="flex items-center gap-[0.8vw]">
                <div className="w-[12vw] h-[0.6vh] rounded-full bg-critical/60" />
                <span className="text-[1.1vw] font-body text-muted">Decay 35%</span>
              </div>
              <div className="flex items-center gap-[0.8vw]">
                <div className="w-[6vw] h-[0.6vh] rounded-full bg-primary/60" />
                <span className="text-[1.1vw] font-body text-muted">Traffic Value 15%</span>
              </div>
              <div className="flex items-center gap-[0.8vw]">
                <div className="w-[4vw] h-[0.6vh] rounded-full bg-warning/60" />
                <span className="text-[1.1vw] font-body text-muted">Traffic Decline 10%</span>
              </div>
              <div className="flex items-center gap-[0.8vw]">
                <div className="w-[7vw] h-[0.6vh] rounded-full bg-accent/60" />
                <span className="text-[1.1vw] font-body text-muted">Keyword Opportunity 20%</span>
              </div>
              <div className="flex items-center gap-[0.8vw]">
                <div className="w-[3vw] h-[0.6vh] rounded-full bg-indigo-400/60" />
                <span className="text-[1.1vw] font-body text-muted">AI Citation 8%</span>
              </div>
              <div className="flex items-center gap-[0.8vw]">
                <div className="w-[2.5vw] h-[0.6vh] rounded-full bg-emerald-400/60" />
                <span className="text-[1.1vw] font-body text-muted">Content Depth 6%</span>
              </div>
            </div>
          </div>
          <div className="mt-[2vh] p-[1.5vw] rounded-[0.8vw] bg-surface/50 border border-primary/20">
            <span className="text-[1.2vw] font-body text-primary font-semibold">AI-Powered</span>
            <p className="text-[1.1vw] font-body text-muted mt-[0.5vh] leading-relaxed">OpenAI GPT-4o-mini scores each page for AI citation likelihood with a 0-100 score and written reasoning</p>
          </div>
        </div>
      </div>
    </div>
  );
}
