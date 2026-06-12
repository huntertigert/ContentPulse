export default function FeaturesSlide() {
  const priorityParts = [
    { label: "Decay", weight: "35", note: "how stale the page already is", color: "text-critical" },
    { label: "Keyword Opportunity", weight: "25", note: "search volume, ranking position + difficulty", color: "text-accent" },
    { label: "Traffic Value", weight: "15", note: "how many clicks the page earns", color: "text-primary" },
    { label: "Traffic Decline", weight: "10", note: "how fast that traffic is dropping", color: "text-warning" },
    { label: "AI Citation", weight: "8", note: "likely to be quoted by AI search", color: "text-indigo-300" },
    { label: "Content Depth", weight: "6", note: "thin pages that need expanding", color: "text-emerald-300" },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="absolute inset-0 opacity-15 [background:radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.4),transparent_50%),radial-gradient(circle_at_15%_85%,rgba(34,211,238,0.25),transparent_45%)]" />
      <div className="relative flex h-full px-[7vw] py-[7vh]">
        <div className="flex flex-col w-[42vw] pr-[4vw] justify-center">
          <div className="flex items-center gap-[0.8vw] mb-[2vh]">
            <div className="w-[2.5vw] h-[3px] bg-primary rounded-full" />
            <span className="text-[1.3vw] font-body tracking-[0.12em] text-primary uppercase">
              Metric 2 · Priority Score
            </span>
          </div>
          <h2 className="text-[3.6vw] leading-[1.05] font-display font-bold tracking-tight text-text mb-[2vh]">
            What to rework first
          </h2>
          <p className="text-[1.3vw] font-body text-muted leading-relaxed mb-[2.5vh]">
            One 0–100 number that ranks your whole worklist. It blends decay with business value, so a stale page that earns traffic and ranks for valuable keywords beats a stale page nobody visits.
          </p>
          <div className="p-[1.3vw] rounded-[0.8vw] bg-primary/10 border border-primary/25">
            <span className="text-[1.25vw] font-body text-text leading-relaxed">
              <span className="font-semibold text-primary">How to use it:</span> sort by Priority, start at the top, work your way down.
            </span>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center pl-[3vw] border-l border-white/5">
          <span className="text-[1.2vw] font-body text-muted uppercase tracking-wider mb-[2vh]">Max points each factor can add</span>
          <div className="flex flex-col gap-[1.4vh]">
            {priorityParts.map((p) => (
              <div key={p.label} className="flex items-baseline gap-[1.2vw]">
                <span className={`font-display font-bold ${p.color} w-[5vw]`}>
                  <span className="text-[1.7vw]">{p.weight}</span>
                  <span className="text-[0.9vw] text-muted ml-[0.3vw]">pts</span>
                </span>
                <div className="flex flex-col">
                  <span className="text-[1.4vw] font-body text-text leading-tight">{p.label}</span>
                  <span className="text-[1.05vw] font-body text-muted leading-tight">{p.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
