export default function WorkflowSlide() {
  const steps = [
    {
      n: "1",
      color: "primary",
      title: "Find",
      body: "Sort by Priority and start at the top. The dashboard surfaces the pages worth your time.",
    },
    {
      n: "2",
      color: "accent",
      title: "Understand",
      body: "Open a page to see its scores, keyword opportunities, and up to 5 specific refresh recommendations.",
    },
    {
      n: "3",
      color: "warning",
      title: "Rework",
      body: "Update facts and stats, add a recent-developments section, sharpen Q&A for AI, and expand thin content.",
    },
    {
      n: "4",
      color: "healthy",
      title: "Track",
      body: "Mark pages Queued \u2192 In Progress \u2192 Refreshed so the whole team can see momentum.",
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    primary: { bg: "bg-primary/15", border: "border-primary/40", text: "text-primary" },
    accent: { bg: "bg-accent/15", border: "border-accent/40", text: "text-accent" },
    warning: { bg: "bg-warning/15", border: "border-warning/40", text: "text-warning" },
    healthy: { bg: "bg-healthy/15", border: "border-healthy/40", text: "text-healthy" },
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="absolute inset-0 opacity-15 [background:radial-gradient(circle_at_50%_80%,rgba(99,102,241,0.4),transparent_55%)]" />
      <div className="relative flex h-full flex-col px-[7vw] py-[7vh]">
        <div className="flex items-center gap-[0.8vw] mb-[2vh]">
          <div className="w-[2.5vw] h-[3px] bg-primary rounded-full" />
          <span className="text-[1.3vw] font-body tracking-[0.12em] text-primary uppercase">
            Your Rework Loop
          </span>
        </div>
        <h2 className="text-[3.8vw] leading-[1.05] font-display font-bold tracking-tight text-text mb-[1vh]">
          From score to rework
        </h2>
        <p className="text-[1.3vw] font-body text-muted mb-[4vh] max-w-[58vw] leading-relaxed">
          Four steps, every month. The data refreshes, the worklist re-ranks, and you pick up where the scores point you.
        </p>
        <div className="flex-1 flex items-center">
          <div className="flex items-start gap-[1.5vw] w-full">
            {steps.map((s, i) => {
              const c = colorMap[s.color];
              return (
                <div key={s.n} className="flex items-start gap-[1.5vw] flex-1">
                  <div className="flex-1 flex flex-col items-center gap-[1.5vh]">
                    <div className={`w-[5vw] h-[5vw] rounded-full ${c.bg} border-2 ${c.border} flex items-center justify-center`}>
                      <span className={`text-[2vw] font-display font-bold ${c.text}`}>{s.n}</span>
                    </div>
                    <span className="text-[1.6vw] font-display font-bold text-text text-center">{s.title}</span>
                    <span className="text-[1.1vw] font-body text-muted text-center leading-relaxed max-w-[15vw]">{s.body}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="mt-[2.5vw] w-[3vw] h-px bg-gradient-to-r from-white/30 to-white/10" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between mt-[3vh]">
          <div className="flex gap-[2vw]">
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
          <div className="flex items-center gap-[0.6vw] px-[1.2vw] py-[0.6vw] rounded-[0.5vw] bg-primary/10 border border-primary/25">
            <span className="text-[1.1vw] font-body text-primary font-semibold">Refreshed pages climb the Freshness Loop</span>
          </div>
        </div>
      </div>
    </div>
  );
}
