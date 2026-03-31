export default function ProblemSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_15%_85%,rgba(244,63,94,0.6),transparent_50%),radial-gradient(circle_at_85%_15%,rgba(99,102,241,0.4),transparent_45%)]" />
      <div className="absolute top-0 right-0 w-[45vw] h-full bg-gradient-to-l from-critical/[0.03] to-transparent" />
      <div className="relative flex h-full flex-col px-[7vw] py-[8vh]">
        <div className="flex items-center gap-[0.8vw] mb-[3vh]">
          <div className="w-[2.5vw] h-[3px] bg-critical rounded-full" />
          <span className="text-[1.3vw] font-body tracking-[0.12em] text-critical uppercase">
            The Problem
          </span>
        </div>
        <h2 className="text-[4.2vw] leading-[1.05] font-display font-bold tracking-tight text-text max-w-[55vw]">
          Content decays silently. AI search makes it urgent.
        </h2>
        <div className="flex-1 flex items-end pb-[2vh]">
          <div className="grid grid-cols-3 gap-[3vw] w-full">
            <div className="flex flex-col gap-[1.5vh] p-[2vw] rounded-[1vw] bg-surface/60 border border-white/5">
              <span className="text-[8vw] leading-none font-display font-bold text-critical">68%</span>
              <span className="text-[1.4vw] font-body text-muted leading-snug">of enterprise blog content is over 12 months old without review</span>
            </div>
            <div className="flex flex-col gap-[1.5vh] p-[2vw] rounded-[1vw] bg-surface/60 border border-white/5">
              <span className="text-[8vw] leading-none font-display font-bold text-warning">3x</span>
              <span className="text-[1.4vw] font-body text-muted leading-snug">faster ranking decay for pages not optimized for AI citation</span>
            </div>
            <div className="flex flex-col gap-[1.5vh] p-[2vw] rounded-[1vw] bg-surface/60 border border-white/5">
              <span className="text-[8vw] leading-none font-display font-bold text-accent">40%</span>
              <span className="text-[1.4vw] font-body text-muted leading-snug">of search results now include AI-generated answers</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
