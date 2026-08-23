"use client";

import { useRef, useState } from "react";
import { Reveal } from "./reveal";

type GalleryItem = {
  number: string;
  label: string;
  /** Tailwind grid placement, applied from lg: up. Mobile stacks naturally. */
  span: string;
  aspect: string;
};

const ITEMS: GalleryItem[] = [
  {
    number: "01",
    label: "PAINT REFLECTION",
    span: "lg:col-start-1 lg:col-span-7 lg:row-start-1 lg:row-span-2",
    aspect: "aspect-[4/3]",
  },
  {
    number: "02",
    label: "WATER BEADS",
    span: "lg:col-start-8 lg:col-span-5 lg:row-start-1 lg:row-span-1",
    aspect: "aspect-[16/10]",
  },
  {
    number: "03",
    label: "WHEEL DETAIL",
    span: "lg:col-start-8 lg:col-span-5 lg:row-start-2 lg:row-span-1",
    aspect: "aspect-[16/10]",
  },
  {
    number: "04",
    label: "PAINT CORRECTION",
    span: "lg:col-start-6 lg:col-span-7 lg:row-start-3 lg:row-span-2",
    aspect: "aspect-[4/3]",
  },
  {
    number: "05",
    label: "INTERIOR LEATHER",
    span: "lg:col-start-1 lg:col-span-5 lg:row-start-3 lg:row-span-1",
    aspect: "aspect-[16/10]",
  },
  {
    number: "06",
    label: "CERAMIC COATING",
    span: "lg:col-start-1 lg:col-span-5 lg:row-start-4 lg:row-span-1",
    aspect: "aspect-[16/10]",
  },
];

function GalleryFrame({ item }: { item: GalleryItem }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative h-full w-full overflow-hidden border border-graphite bg-charcoal ${item.aspect} lg:aspect-auto`}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-card via-charcoal to-obsidian transition-transform duration-700 ease-out group-hover:scale-105"
      />

      {/* Subtle sheen — reads as a reflection on hover, not a gimmick */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent transition-opacity duration-700 ${
          hovered ? "opacity-100" : "opacity-0"
        }`}
      />

      <span
        aria-hidden
        className="absolute -bottom-4 -right-2 select-none text-[6rem] font-bold leading-none tracking-tighter text-graphite/50 sm:text-[8rem] lg:text-[9rem]"
      >
        {item.number}
      </span>

      <span aria-hidden className="absolute left-4 top-4 h-4 w-4 border-l border-t border-silver/40" />
      <span aria-hidden className="absolute right-4 top-4 h-4 w-4 border-r border-t border-silver/40" />
      <span aria-hidden className="absolute bottom-4 left-4 h-4 w-4 border-b border-l border-silver/40" />
      <span aria-hidden className="absolute bottom-4 right-4 h-4 w-4 border-b border-r border-silver/40" />

      <div className="absolute bottom-4 left-4 flex items-center gap-2">
        <span className="text-[10px] font-semibold tracking-[0.15em] text-noir-text-secondary">
          {item.number}
        </span>
        <span className="h-px w-4 bg-graphite" />
        <span className="text-[10px] font-semibold tracking-[0.25em] text-noir-text-secondary">
          {item.label}
        </span>
      </div>
    </div>
  );
}

export function Gallery() {
  return (
    <section id="gallery" className="bg-obsidian px-6 py-24 md:px-10">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.5em] text-noir-text-secondary">
            THE FINISH
          </p>
        </Reveal>

        <Reveal delayMs={150}>
          <h2 className="mt-6 max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight text-noir-text sm:text-5xl md:text-6xl">
            DETAILS
            <br />
            YOU CAN SEE.
          </h2>
        </Reveal>

        <Reveal delayMs={300}>
          <p className="mt-6 max-w-lg text-base text-noir-text-secondary md:text-lg">
            Every surface tells a story. The difference is in how carefully it
            is finished.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:auto-rows-[13rem] lg:gap-5">
          {ITEMS.map((item, index) => (
            <Reveal
              key={item.number}
              delayMs={index * 90}
              scale
              className={item.span}
            >
              <GalleryFrame item={item} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
