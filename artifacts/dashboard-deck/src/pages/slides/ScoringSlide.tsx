export default function ScoringSlide() {
  const freshnessBands = [
    { range: "0–30 days", score: "90–100", color: "bg-healthy" },
    { range: "1–2 months", score: "70–90", color: "bg-healthy/70" },
    { range: "2–3 months", score: "50–70", color: "bg-warning/80" },
    { range: "3–6 months", score: "25–50", color: "bg-warning" },
    { range: "6–12 months", score: "10–25", color: "bg-critical/80" },
    { range: "12 months+", score: "0–10", color: "bg-critical" },
  ];

  const priorityParts = [
    { label: "Decay", weight: "35%", note: "how stale the page is", color: "text-critical" },
    { label: "Keyword Opportunity", weight: "20%", note: "search volume + ranking position", color: "text-accent" },
    { label: "Traffic Value", weight: "15%", note: "clicks the page earns", color: "text-primary" },
    { label: "Traffic Decline", weight: "10%", note: "how fast traffic is dropping", color: "text-warning" },
    { label: "AI Citation", weight: "8%", note: "likely to be cited by AI search", color: "text-indigo-300" },
    { label: "Content Depth", weight: "6%", note: "thin pages that need expansion", color: "text-emerald-300" },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="absolute inset-0 opacity-15 [background:radial-gradient(circle_at_20%_20%,rgba(244,63,94,0.3),transparent_50%),radial-gradient(circle_at_85%_80%,rgba(99,102,241,0.35),transparent_50%)]" />
      <div className="relative flex h-full flex-col px-[7vw] py-[6vh]">
        <div className="flex items-center gap-[0.8vw] mb-[1.5vh]">
          <div className="w-[2.5vw] h-[3px] bg-primary rounded-full" />
          <span className="text-[1.3vw] font-body tracking-[0.12em] text-primary uppercase">
            How Scoring Works
          </span>
        </div>
        <h2 className="text-[3.6vw] leading-[1.05] font-display font-bold tracking-tight text-text mb-[4vh]">
          From freshness to priority
        </h2>

        <div className="flex-1 flex gap-[3vw]">
          {/* Decay column */}
          <div className="flex-1 flex flex-col">
            <span className="text-[1.7vw] font-display font-bold text-critical mb-[0.5vh]">Decay Score</span>
            <p className="text-[1.1vw] font-body text-muted leading-relaxed mb-[2vh] max-w-[34vw]">
              Measures how stale a page has become, from 0 (fresh) to 100 (badly decayed).
              It starts as the inverse of a time-based <span className="text-text">Freshness Score</span>:
              <span className="text-text"> Decay = 100 − Freshness</span>.
            </p>
            <div className="flex flex-col gap-[0.9vh]">
              {freshnessBands.map((b) => (
                <div key={b.range} className="flex items-center gap-[1vw]">
                  <span className="text-[1.05vw] font-body text-muted w-[9vw]">{b.range}</span>
                  <div className="flex-1 h-[1vh] rounded-full bg-white/5 overflow-hidden">
                    <div className={`h-full ${b.color} rounded-full`} style={{ width: b.score === "90–100" ? "100%" : b.score === "70–90" ? "80%" : b.score === "50–70" ? "60%" : b.score === "25–50" ? "40%" : b.score === "10–25" ? "20%" : "8%" }} />
                  </div>
                  <span className="text-[1.05vw] font-body text-text w-[5vw] text-right">{b.score}</span>
                </div>
              ))}
            </div>
            <div className="mt-[2vh] p-[1.2vw] rounded-[0.8vw] bg-surface/50 border border-critical/20">
              <span className="text-[1.05vw] font-body text-muted leading-relaxed">
                Extra decay penalties: <span className="text-text">+15</span> if older than 3 months and traffic is falling,
                <span className="text-text"> +10</span> if older than a year. A small boost offsets decay for high-traffic, rising pages.
              </span>
            </div>
          </div>

          {/* Priority column */}
          <div className="w-px bg-white/5" />
          <div className="flex-1 flex flex-col">
            <span className="text-[1.7vw] font-display font-bold text-primary mb-[0.5vh]">Priority Score</span>
            <p className="text-[1.1vw] font-body text-muted leading-relaxed mb-[2vh] max-w-[34vw]">
              A 0–100 ranking of <span className="text-text">what to fix first</span>. It blends decay with business
              value, so a stale page that earns traffic and ranks for valuable keywords rises to the top.
            </p>
            <div className="flex flex-col gap-[1.1vh]">
              {priorityParts.map((p) => (
                <div key={p.label} className="flex items-baseline gap-[1vw]">
                  <span className={`text-[1.4vw] font-display font-bold ${p.color} w-[4vw]`}>{p.weight}</span>
                  <div className="flex flex-col">
                    <span className="text-[1.2vw] font-body text-text leading-tight">{p.label}</span>
                    <span className="text-[1vw] font-body text-muted leading-tight">{p.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
