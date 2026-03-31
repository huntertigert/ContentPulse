export default function FeaturesSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="absolute inset-0 opacity-15 [background:radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.4),transparent_50%),radial-gradient(circle_at_20%_80%,rgba(99,102,241,0.3),transparent_45%)]" />
      <div className="relative flex h-full flex-col px-[7vw] py-[7vh]">
        <div className="flex items-center gap-[0.8vw] mb-[2vh]">
          <div className="w-[2.5vw] h-[3px] bg-accent rounded-full" />
          <span className="text-[1.3vw] font-body tracking-[0.12em] text-accent uppercase">
            Key Capabilities
          </span>
        </div>
        <h2 className="text-[3.8vw] leading-[1.05] font-display font-bold tracking-tight text-text mb-[5vh]">
          Built for content teams
        </h2>
        <div className="grid grid-cols-3 gap-[2vw] flex-1">
          <div className="flex flex-col gap-[1.5vh] p-[1.8vw] rounded-[0.8vw] bg-surface/50 border border-white/5">
            <div className="w-[3vw] h-[3vw] rounded-[0.6vw] bg-primary/15 flex items-center justify-center">
              <span className="text-[1.5vw] font-display font-bold text-primary">P</span>
            </div>
            <span className="text-[1.6vw] font-display font-bold text-text">Priority Score</span>
            <span className="text-[1.2vw] font-body text-muted leading-relaxed">Weighted 0-100 composite: decay, traffic, keywords, AI citation, and content depth</span>
          </div>
          <div className="flex flex-col gap-[1.5vh] p-[1.8vw] rounded-[0.8vw] bg-surface/50 border border-white/5">
            <div className="w-[3vw] h-[3vw] rounded-[0.6vw] bg-accent/15 flex items-center justify-center">
              <span className="text-[1.5vw] font-display font-bold text-accent">AI</span>
            </div>
            <span className="text-[1.6vw] font-display font-bold text-text">AI Citation Prediction</span>
            <span className="text-[1.2vw] font-body text-muted leading-relaxed">GPT-powered scoring predicts which pages AI search engines will cite</span>
          </div>
          <div className="flex flex-col gap-[1.5vh] p-[1.8vw] rounded-[0.8vw] bg-surface/50 border border-white/5">
            <div className="w-[3vw] h-[3vw] rounded-[0.6vw] bg-healthy/15 flex items-center justify-center">
              <span className="text-[1.5vw] font-display font-bold text-healthy">F</span>
            </div>
            <span className="text-[1.6vw] font-display font-bold text-text">Freshness Loop</span>
            <span className="text-[1.2vw] font-body text-muted leading-relaxed">Visual progress bar showing what percentage of your site is fresh within 90 days</span>
          </div>
          <div className="flex flex-col gap-[1.5vh] p-[1.8vw] rounded-[0.8vw] bg-surface/50 border border-white/5">
            <div className="w-[3vw] h-[3vw] rounded-[0.6vw] bg-warning/15 flex items-center justify-center">
              <span className="text-[1.5vw] font-display font-bold text-warning">T</span>
            </div>
            <span className="text-[1.6vw] font-display font-bold text-text">Smart Triage</span>
            <span className="text-[1.2vw] font-body text-muted leading-relaxed">Auto-classify pages as Critical, Review, or Healthy with color-coded badges</span>
          </div>
          <div className="flex flex-col gap-[1.5vh] p-[1.8vw] rounded-[0.8vw] bg-surface/50 border border-white/5">
            <div className="w-[3vw] h-[3vw] rounded-[0.6vw] bg-critical/15 flex items-center justify-center">
              <span className="text-[1.5vw] font-display font-bold text-critical">K</span>
            </div>
            <span className="text-[1.6vw] font-display font-bold text-text">SEMrush Keywords</span>
            <span className="text-[1.2vw] font-body text-muted leading-relaxed">Keyword rankings, search volume, and position data per page via CSV import</span>
          </div>
          <div className="flex flex-col gap-[1.5vh] p-[1.8vw] rounded-[0.8vw] bg-surface/50 border border-white/5">
            <div className="w-[3vw] h-[3vw] rounded-[0.6vw] bg-primary/15 flex items-center justify-center">
              <span className="text-[1.5vw] font-display font-bold text-primary">R</span>
            </div>
            <span className="text-[1.6vw] font-display font-bold text-text">Refresh Recommendations</span>
            <span className="text-[1.2vw] font-body text-muted leading-relaxed">Up to 5 data-driven action items per page based on real metrics</span>
          </div>
        </div>
      </div>
    </div>
  );
}
