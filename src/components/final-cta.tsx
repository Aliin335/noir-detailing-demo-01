import { Reveal } from "./reveal";

export function FinalCta() {
  return (
    <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden bg-obsidian px-6 py-32 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(41,41,41,0.3)_0%,_rgba(8,8,8,0)_65%)]"
      />

      <Reveal>
        <p className="relative text-xs font-semibold tracking-[0.5em] text-noir-text-secondary">
          READY WHEN YOU ARE.
        </p>
      </Reveal>

      <Reveal delayMs={150}>
        <h2 className="relative mt-8 max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight text-noir-text sm:text-6xl md:text-7xl">
          YOUR CAR DESERVES
          <br />
          THE DETAIL.
        </h2>
      </Reveal>

      <Reveal delayMs={300}>
        <p className="relative mt-8 max-w-md text-base text-noir-text-secondary md:text-lg">
          Ready for a finish that looks as good as it feels?
        </p>
      </Reveal>

      <Reveal delayMs={450}>
        <div className="relative mt-12 flex flex-col items-center gap-4 sm:flex-row">
          <a
            href="#book"
            className="inline-flex items-center gap-2 border border-noir-white bg-noir-white px-9 py-4 text-xs font-semibold tracking-[0.18em] text-obsidian transition-colors hover:bg-silver"
          >
            BOOK A DETAIL
            <span aria-hidden>→</span>
          </a>
          <a
            href="#services"
            className="border border-graphite px-9 py-4 text-xs font-semibold tracking-[0.18em] text-noir-text transition-colors hover:border-silver"
          >
            EXPLORE SERVICES
          </a>
        </div>
      </Reveal>
    </section>
  );
}
