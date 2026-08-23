export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-obsidian px-6 text-center"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(41,41,41,0.35)_0%,_rgba(8,8,8,0)_60%)]"
      />

      <p className="relative text-xs font-semibold tracking-[0.5em] text-noir-text-secondary">
        NOIR
      </p>

      <h1 className="relative mt-6 max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight text-noir-text sm:text-6xl md:text-7xl">
        YOUR CAR.
        <br />
        ABSOLUTELY REFINED.
      </h1>

      <p className="relative mt-6 max-w-md text-base text-noir-text-secondary md:text-lg">
        Premium automotive detailing for vehicles that deserve more.
      </p>

      <div className="relative mt-10 flex flex-col items-center gap-4 sm:flex-row">
        <a
          href="#book"
          className="border border-noir-white bg-noir-white px-8 py-3.5 text-xs font-semibold tracking-[0.18em] text-obsidian transition-colors hover:bg-silver"
        >
          BOOK A DETAIL
        </a>
        <a
          href="#process"
          className="border border-graphite px-8 py-3.5 text-xs font-semibold tracking-[0.18em] text-noir-text transition-colors hover:border-silver"
        >
          EXPLORE THE PROCESS
        </a>
      </div>

      <div className="absolute bottom-10 flex flex-col items-center gap-2 text-noir-text-secondary">
        <span className="text-[10px] tracking-[0.3em]">SCROLL</span>
        <span className="h-10 w-px animate-pulse bg-graphite" />
      </div>
    </section>
  );
}
