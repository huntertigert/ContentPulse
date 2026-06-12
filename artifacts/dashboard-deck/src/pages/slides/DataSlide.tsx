export default function DataSlide() {
  const signals = [
    {
      tag: "AI",
      tagColor: "bg-indigo-400/15 text-indigo-300",
      title: "AI Citation Likelihood",
      body: "Will AI search quote this page? Each page is scored 0–100; 65+ is flagged \u201cLikely to be cited.\u201d Protect and strengthen these.",
    },
    {
      tag: "KW",
      tagColor: "bg-accent/15 text-accent",
      title: "Keyword Opportunity",
      body: "Search volume, ranking position, and difficulty from SEMrush. High volume sitting just off page one = the biggest rework upside.",
    },
    {
      tag: "TR",
      tagColor: "bg-primary/15 text-primary",
      title: "Traffic Trend",
      body: "Clicks vs. the previous 30 days from Search Console. A falling trend on an older page is your cue to act now.",
    },
    {
      tag: "ST",
      tagColor: "bg-warning/15 text-warning",
      title: "Triage Status",
      body: "A quick urgency read: Critical (old + losing traffic), Review (aging), or Healthy (recently fresh).",
    },
    {
      tag: "CD",
      tagColor: "bg-emerald-400/15 text-emerald-300",
      title: "Content Depth",
      body: "Word count flags thin pages. Under 500 words on an important topic needs expansion, not just a refresh.",
    },
    {
      tag: "RX",
      tagColor: "bg-healthy/15 text-healthy",
      title: "Refresh Recommendations",
      body: "Up to 5 specific, data-driven actions per page — so you open a page already knowing what to change.",
    },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="absolute inset-0 opacity-15 [background:radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.3),transparent_50%)]" />
      <div className="relative flex h-full flex-col px-[7vw] py-[7vh]">
        <div className="flex items-center gap-[0.8vw] mb-[2vh]">
          <div className="w-[2.5vw] h-[3px] bg-accent rounded-full" />
          <span className="text-[1.3vw] font-body tracking-[0.12em] text-accent uppercase">
            Metric 3 · The Supporting Signals
          </span>
        </div>
        <h2 className="text-[3.6vw] leading-[1.05] font-display font-bold tracking-tight text-text mb-[1vh]">
          What each signal tells you
        </h2>
        <p className="text-[1.3vw] font-body text-muted mb-[4vh] max-w-[60vw] leading-relaxed">
          These feed the Priority Score — and help you decide <span className="text-text">how</span> to rework a page once you've picked it.
        </p>
        <div className="grid grid-cols-3 gap-[2vw] flex-1">
          {signals.map((s) => (
            <div key={s.title} className="flex flex-col gap-[1.2vh] p-[1.8vw] rounded-[0.8vw] bg-surface/50 border border-white/5">
              <div className={`w-[3vw] h-[3vw] rounded-[0.6vw] flex items-center justify-center ${s.tagColor}`}>
                <span className="text-[1.2vw] font-display font-bold">{s.tag}</span>
              </div>
              <span className="text-[1.5vw] font-display font-bold text-text leading-tight">{s.title}</span>
              <span className="text-[1.15vw] font-body text-muted leading-relaxed">{s.body}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
