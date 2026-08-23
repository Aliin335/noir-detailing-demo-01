"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "./reveal";

type Service = {
  number: string;
  title: string;
  price: string;
  description: string;
  items: string[];
};

const SERVICES: Service[] = [
  {
    number: "01",
    title: "ESSENTIAL DETAIL",
    price: "€90",
    description:
      "A refined maintenance detail for keeping your vehicle clean, fresh and road-ready.",
    items: ["Exterior wash", "Interior refresh", "Wheel & tyre clean"],
  },
  {
    number: "02",
    title: "FULL DETAIL",
    price: "€180",
    description:
      "A complete inside-and-out reset for vehicles that need more than a routine clean.",
    items: ["Deep interior clean", "Exterior decontamination", "Paint enhancement"],
  },
  {
    number: "03",
    title: "CERAMIC PROTECTION",
    price: "€450",
    description:
      "A precision finish designed to restore depth, enhance gloss and protect the paintwork.",
    items: ["Paint correction", "Ceramic coating", "Long-term protection"],
  },
];

function VisualFrame({ number }: { number: string }) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden border border-graphite bg-charcoal md:aspect-[3/4]">
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-card via-charcoal to-obsidian"
      />
      <span
        aria-hidden
        className="absolute -bottom-6 -right-2 select-none text-[9rem] font-bold leading-none tracking-tighter text-graphite/50 md:text-[11rem]"
      >
        {number}
      </span>
      {/* Corner marks — frame reserved for real service photography */}
      <span aria-hidden className="absolute left-4 top-4 h-4 w-4 border-l border-t border-silver/40" />
      <span aria-hidden className="absolute right-4 top-4 h-4 w-4 border-r border-t border-silver/40" />
      <span aria-hidden className="absolute bottom-4 left-4 h-4 w-4 border-b border-l border-silver/40" />
      <span aria-hidden className="absolute bottom-4 right-4 h-4 w-4 border-b border-r border-silver/40" />
    </div>
  );
}

function ServiceRow({ service, index }: { service: Service; index: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const visualFirst = index % 2 === 1;

  return (
    <Reveal>
      <div
        ref={ref}
        className={`group grid gap-10 border-t border-graphite py-16 transition-colors duration-700 first:border-t-0 md:grid-cols-2 md:items-center md:gap-16 ${
          index === SERVICES.length - 1 ? "border-b" : ""
        }`}
      >
        <div
          className={`order-2 ${
            visualFirst ? "md:order-2" : "md:order-1"
          } transition-opacity duration-700 ${
            active ? "opacity-100" : "opacity-60"
          } group-hover:opacity-100`}
        >
          <span
            className={`text-sm tracking-[0.3em] transition-colors duration-700 ${
              active ? "text-silver" : "text-noir-text-secondary"
            }`}
          >
            {service.number}
          </span>

          <h3
            className={`mt-4 text-3xl font-bold tracking-tight transition-colors duration-700 sm:text-4xl ${
              active ? "text-noir-text" : "text-noir-text-secondary"
            }`}
          >
            {service.title}
          </h3>

          <p className="mt-3 text-2xl font-semibold text-noir-text">
            {service.price}
          </p>

          <p className="mt-5 max-w-sm text-sm text-noir-text-secondary md:text-base">
            {service.description}
          </p>

          <ul className="mt-6 space-y-2">
            {service.items.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 text-sm text-noir-text-secondary"
              >
                <span aria-hidden className="h-px w-4 bg-graphite" />
                {item}
              </li>
            ))}
          </ul>

          <a
            href="#book"
            className="mt-8 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-noir-text transition-colors hover:text-silver"
          >
            BOOK THIS DETAIL
            <span aria-hidden>→</span>
          </a>
        </div>

        <div
          className={`order-1 ${visualFirst ? "md:order-1" : "md:order-2"}`}
        >
          <VisualFrame number={service.number} />
        </div>
      </div>
    </Reveal>
  );
}

export function Services() {
  return (
    <section id="services" className="bg-obsidian px-6 py-24 md:px-10">
      <div className="mx-auto max-w-6xl">
        {SERVICES.map((service, index) => (
          <ServiceRow key={service.number} service={service} index={index} />
        ))}
      </div>
    </section>
  );
}
