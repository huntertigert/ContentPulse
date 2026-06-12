export default function ScoringSlide() {
  const freshnessBands = [
    { range: "0–30 days", score: "90–100", color: "bg-healthy", width: "100%" },
    { range: "1–2 months", score: "70–90", color: "bg-healthy/70", width: "80%" },
    { range: "2–3 months", score: "50–70", color: "bg-warning/80", width: "60%" },
    { range: "3–6 months", score: "25–50", color: "bg-warning", width: "40%" },
    { range: "6–12 months", score: "10–25", color: "bg-critical/80", width: "20%" },
    { range: "12 months+", score: "0–10", color: "bg-critical", width: "8%" },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="absolute inset-0 opacity-15 [background:radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.25),transparent_50%),radial-gradient(circle_at_85%_80%,rgba(244,63,94,0.3),transparent_50%)]" />
      <div className="relative flex h-full flex-col px-[7vw] py-[6vh]">
        <div className="flex items-center gap-[0.8vw] mb-[1.5vh]">
          <div className="w-[2.5vw] h-[3px] bg-healthy rounded-full" />
          <span className="text-[1.3vw] font-body tracking-[0.12em] text-healthy uppercase">
            Metric 1 · Freshness &amp; Decay
          </span>
        </div>
        <h2 className="text-[3.6vw] leading-[1.05] font-display font-bold tracking-tight text-text mb-[1vh]">
          How stale is this page?
        </h2>
        <p className="text-[1.3vw] font-body text-muted mb-[3vh] max-w-[60vw] leading-relaxed">
          Your first signal that a page needs a rework. Freshness measures how recently it was meaningfully updated; Decay is the flip side.
        </p>

        <div className="flex-1 flex gap-[3vw]">
          {/* Freshness column */}
          <div className="flex-1 flex flex-col">
            <span className="text-[1.7vw] font-display font-bold text-healthy mb-[0.5vh]">Freshness Score</span>
            <p className="text-[1.05vw] font-body text-muted leading-relaxed mb-[2vh] max-w-[34vw]">
              0–100, higher is fresher. It's driven almost entirely by how long it's been
              since the page was last updated:
            </p>
            <div className="flex flex-col gap-[0.9vh]">
              {freshnessBands.map((b) => (
                <div key={b.range} className="flex items-center gap-[1vw]">
                  <span className="text-[1.05vw] font-body text-muted w-[9vw]">{b.range}</span>
                  <div className="flex-1 h-[1vh] rounded-full bg-white/5 overflow-hidden">
                    <div className={`h-full ${b.color} rounded-full`} style={{ width: b.width }} />
                  </div>
                  <span className="text-[1.05vw] font-body text-text w-[5vw] text-right">{b.score}</span>
                </div>
              ))}
            </div>
            <p className="text-[1vw] font-body text-muted/80 mt-[1.5vh] leading-relaxed max-w-[34vw]">
              Small boost for high-traffic pages, plus a little extra when traffic is rising — a popular, growing page reads as fresher.
            </p>
          </div>

          {/* Decay column */}
          <div className="w-px bg-white/5" />
          <div className="flex-1 flex flex-col">
            <span className="text-[1.7vw] font-display font-bold text-critical mb-[0.5vh]">Decay Score</span>
            <p className="text-[1.05vw] font-body text-muted leading-relaxed mb-[2vh] max-w-[34vw]">
              0–100, higher means more decayed. It starts as the mirror of freshness —
              <span className="text-text"> Decay = 100 − Freshness</span> — then adds penalties when a page
              is both old and slipping.
            </p>
            <div className="flex flex-col gap-[1.2vh]">
              <div className="flex items-baseline gap-[1vw] p-[1vw] rounded-[0.6vw] bg-surface/50 border border-white/5">
                <span className="text-[1.4vw] font-display font-bold text-critical w-[3.5vw]">+15</span>
                <span className="text-[1.1vw] font-body text-text leading-tight">older than 3 months <span className="text-muted">and</span> losing traffic</span>
              </div>
              <div className="flex items-baseline gap-[1vw] p-[1vw] rounded-[0.6vw] bg-surface/50 border border-white/5">
                <span className="text-[1.4vw] font-display font-bold text-critical w-[3.5vw]">+10</span>
                <span className="text-[1.1vw] font-body text-text leading-tight">older than a year</span>
              </div>
            </div>
            <div className="mt-[2.5vh] p-[1.2vw] rounded-[0.8vw] bg-critical/10 border border-critical/20">
              <span className="text-[1.1vw] font-body text-text leading-relaxed">
                <span className="font-semibold text-critical">Rule of thumb:</span> past 90 days a page is drifting; past a year it's likely costing you traffic. A high decay score = put it on the rework list.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
