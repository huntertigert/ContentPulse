const base = import.meta.env.BASE_URL;

export default function ClosingSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <img
        src={`${base}hero-bg.png`}
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-cover opacity-25"
        alt="Abstract data visualization"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-bg/60" />
      <div className="absolute bottom-0 left-0 w-full h-[40vh] bg-gradient-to-t from-primary/[0.06] to-transparent" />
      <div className="relative flex h-full flex-col items-center justify-center text-center px-[7vw]">
        <div className="flex items-center gap-[1vw] mb-[3vh]">
          <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-healthy" />
          <span className="text-[1.4vw] font-body tracking-[0.12em] text-accent uppercase">
            Content Intelligence
          </span>
        </div>
        <h2 className="text-[5.5vw] leading-[0.95] font-display font-bold tracking-tight text-text">
          Take control of
        </h2>
        <h2 className="text-[5.5vw] leading-[0.95] font-display font-bold tracking-tight text-primary">
          content freshness
        </h2>
        <p className="mt-[3vh] max-w-[45vw] text-[1.6vw] leading-relaxed font-body text-muted">
          Stop guessing which pages need attention. Let data, AI, and keyword intelligence drive your content refresh strategy.
        </p>
        <div className="mt-[5vh] flex items-center gap-[3vw]">
          <div className="flex items-center gap-[0.6vw] text-[1.2vw] font-body text-muted/70">
            <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-primary/50" />
            <span>Priority Scoring</span>
          </div>
          <div className="flex items-center gap-[0.6vw] text-[1.2vw] font-body text-muted/70">
            <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-accent/50" />
            <span>AI Citation Prediction</span>
          </div>
          <div className="flex items-center gap-[0.6vw] text-[1.2vw] font-body text-muted/70">
            <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-healthy/50" />
            <span>Workflow Tracking</span>
          </div>
          <div className="flex items-center gap-[0.6vw] text-[1.2vw] font-body text-muted/70">
            <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-warning/50" />
            <span>Keyword Intelligence</span>
          </div>
        </div>
      </div>
    </div>
  );
}
