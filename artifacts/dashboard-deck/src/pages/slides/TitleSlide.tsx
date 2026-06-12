const base = import.meta.env.BASE_URL;

export default function TitleSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <img
        src={`${base}hero-bg.png`}
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-cover opacity-40"
        alt="Abstract data visualization"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg/80 to-transparent" />
      <div className="absolute top-[12vh] left-[7vw] w-[3px] h-[35vh] bg-gradient-to-b from-primary via-accent to-transparent rounded-full" />
      <div className="relative flex h-full flex-col justify-between px-[7vw] py-[8vh]">
        <div className="flex items-center gap-[1vw]">
          <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-healthy" />
          <span className="text-[1.3vw] font-body tracking-[0.15em] text-accent uppercase">
            For the Product Marketing Team
          </span>
        </div>
        <div className="max-w-[68vw]">
          <h1 className="text-[6.2vw] leading-[0.92] font-display font-bold tracking-tight text-text">
            The Content
          </h1>
          <h1 className="text-[6.2vw] leading-[0.92] font-display font-bold tracking-tight text-primary">
            Rework Playbook
          </h1>
          <p className="mt-[3vh] max-w-[50vw] text-[1.7vw] leading-relaxed font-body text-muted">
            How to find the pages worth reworking, read the scores behind them, and know exactly what to fix — powered by the Content Freshness Dashboard.
          </p>
        </div>
        <div className="flex items-center gap-[2vw] text-[1.3vw] font-body text-muted">
          <span>Product Marketing</span>
          <div className="w-[3vw] h-px bg-muted/40" />
          <span>2026</span>
        </div>
      </div>
    </div>
  );
}
