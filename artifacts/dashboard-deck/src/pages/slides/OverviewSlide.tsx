const base = import.meta.env.BASE_URL;

export default function OverviewSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <div className="absolute inset-0 opacity-10 [background:radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.5),transparent_60%)]" />
      <div className="relative flex h-full flex-col px-[7vw] py-[6vh]">
        <div className="flex items-center gap-[0.8vw] mb-[2vh]">
          <div className="w-[2.5vw] h-[3px] bg-primary rounded-full" />
          <span className="text-[1.3vw] font-body tracking-[0.12em] text-primary uppercase">
            Dashboard Overview
          </span>
        </div>
        <h2 className="text-[3.5vw] leading-[1.05] font-display font-bold tracking-tight text-text mb-[3vh]">
          Everything at a glance
        </h2>
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-[82vw] rounded-[1vw] overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(99,102,241,0.15)]">
            <img
              src={`${base}dashboard-hero.jpg`}
              crossOrigin="anonymous"
              className="w-full h-auto"
              alt="Content Freshness Dashboard showing stats cards, freshness loop, triage tabs, and data table"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg/30 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
