import { Reveal } from "./reveal";

type Principle = {
  number: string;
  title: string;
  description: string;
};

const PRINCIPLES: Principle[] = [
  {
    number: "01",
    title: "PRECISION",
    description: "Every panel, surface and detail receives deliberate attention.",
  },
  {
    number: "02",
    title: "CRAFT",
    description:
      "We focus on the process behind the finish, not just the final appearance.",
  },
  {
    number: "03",
    title: "PROTECTION",
    description:
      "A great finish should last beyond the day you collect your vehicle.",
  },
  {
    number: "04",
    title: "CONSISTENCY",
    description: "The same standard applies to every vehicle, every time.",
  },
];

type Stat = { value: string; label: string };

const STATS: Stat[] = [
  { value: "04", label: "STAGES" },
  { value: "01", label: "STANDARD" },
  { value: "100%", label: "ATTENTION" },
];

export function WhyNoir() {
  return (
    <section className="bg-obsidian px-6 py-24 md:px-10">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.5em] text-noir-text-secondary">
            WHY NOIR
          </p>
        </Reveal>

        <Reveal delayMs={150}>
          <h2 className="mt-6 max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight text-noir-text sm:text-5xl md:text-6xl">
            NOT A CAR WASH.
          </h2>
        </Reveal>

        <Reveal delayMs={300}>
          <p className="mt-6 max-w-lg text-base text-noir-text-secondary md:text-lg">
            A meticulous process designed around the finish, feel and
            condition of your vehicle.
          </p>
        </Reveal>

        <div className="mt-16 border-t border-graphite">
          {PRINCIPLES.map((principle, index) => (
            <Reveal key={principle.number} delayMs={index * 80}>
              <div className="grid gap-3 border-b border-graphite py-8 md:grid-cols-[100px_1fr] md:gap-10">
                <span className="text-sm tracking-[0.3em] text-noir-text-secondary">
                  {principle.number}
                </span>
                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-noir-text sm:text-3xl">
                    {principle.title}
                  </h3>
                  <p className="mt-3 max-w-xl text-sm text-noir-text-secondary md:text-base">
                    {principle.description}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delayMs={200}>
          <div className="mt-16 grid grid-cols-1 divide-y divide-graphite border-t border-graphite sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-start gap-2 py-8 sm:items-center sm:px-8"
              >
                <span className="text-5xl font-bold tracking-tight text-noir-text md:text-6xl">
                  {stat.value}
                </span>
                <span className="text-xs tracking-[0.3em] text-noir-text-secondary">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
