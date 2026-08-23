import { Reveal } from "./reveal";

export function NoirStandard() {
  return (
    <section
      id="about"
      className="relative flex min-h-[90vh] items-center bg-obsidian px-6 py-32 md:px-10"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-16 md:grid-cols-[1fr_auto] md:items-end md:gap-24">
        <div>
          <Reveal>
            <p className="text-xs font-semibold tracking-[0.5em] text-noir-text-secondary">
              THE NOIR STANDARD
            </p>
          </Reveal>

          <Reveal delayMs={150}>
            <h2 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight text-noir-text sm:text-6xl md:text-7xl">
              DETAILING
              <br />
              WITHOUT
              <br />
              COMPROMISE.
            </h2>
          </Reveal>

          <Reveal delayMs={300}>
            <p className="mt-8 max-w-md text-base text-noir-text-secondary md:text-lg">
              Precision detailing for vehicles that demand more than a quick
              clean.
            </p>
          </Reveal>
        </div>

        <Reveal delayMs={450}>
          <div className="flex items-center gap-4 text-noir-text-secondary md:flex-col md:items-end md:gap-4">
            <span className="text-sm tracking-[0.3em]">01</span>
            <span className="h-px w-10 bg-graphite md:h-10 md:w-px" />
            <span className="text-sm tracking-[0.3em]">SERVICES</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
