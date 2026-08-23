"use client";

import { useEffect, useRef } from "react";
import { Reveal } from "./reveal";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type Stage = {
  number: string;
  title: string;
  description: string;
};

const STAGES: Stage[] = [
  {
    number: "01",
    title: "INSPECTION",
    description:
      "We assess the vehicle's paint, interior, wheels and existing condition before any work begins.",
  },
  {
    number: "02",
    title: "PREPARATION",
    description:
      "A careful decontamination and preparation stage removes what ordinary washing leaves behind.",
  },
  {
    number: "03",
    title: "CORRECTION",
    description:
      "Paintwork is refined and restored to reveal deeper gloss, clarity and consistency.",
  },
  {
    number: "04",
    title: "PROTECTION",
    description:
      "The finished surface is protected so the result lasts beyond the day of collection.",
  },
];

const ACTIVE_BORDER = "var(--noir-silver)";
const MUTED_BORDER = "var(--noir-graphite)";
const ACTIVE_TEXT = "var(--noir-text)";
const MUTED_TEXT = "var(--noir-text-secondary)";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function Process() {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const badgeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const titleRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const tickingRef = useRef(false);

  useEffect(() => {
    const applyActive = (activeIndex: number) => {
      STAGES.forEach((_, i) => {
        const isActive = i <= activeIndex;
        const badge = badgeRefs.current[i];
        const title = titleRefs.current[i];
        if (badge) {
          badge.style.borderColor = isActive ? ACTIVE_BORDER : MUTED_BORDER;
          badge.style.color = isActive ? ACTIVE_TEXT : MUTED_TEXT;
        }
        if (title) {
          title.style.color = isActive ? ACTIVE_TEXT : MUTED_TEXT;
        }
      });
    };

    if (reducedMotion) {
      if (fillRef.current) fillRef.current.style.transform = "scale(1)";
      applyActive(STAGES.length - 1);
      return;
    }

    const section = sectionRef.current;
    if (!section) return;

    const update = () => {
      const rect = section.getBoundingClientRect();
      // 0 the moment the section's top edge reaches the viewport bottom
      // (just entering), 1 once its bottom edge reaches the viewport bottom
      // (the section has fully arrived). Measuring the whole section rather
      // than just the stage row spreads the illumination across a natural
      // scroll-through distance, and — since a section's bottom always
      // aligns with the viewport bottom at the page's maximum scroll — this
      // always reaches exactly 1 even when Process is the last section on
      // the page with no scroll room left afterward.
      const progress = clamp(
        (window.innerHeight - rect.top) / rect.height,
        0,
        1
      );
      if (fillRef.current) {
        fillRef.current.style.transform = `scale(${progress})`;
      }
      const activeIndex = Math.min(
        STAGES.length - 1,
        Math.floor(progress * STAGES.length)
      );
      applyActive(progress <= 0 ? -1 : activeIndex);
    };

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(() => {
        update();
        tickingRef.current = false;
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reducedMotion]);

  return (
    <section
      id="process"
      ref={sectionRef}
      className="bg-obsidian px-6 py-24 md:px-10"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.5em] text-noir-text-secondary">
            THE NOIR PROCESS
          </p>
        </Reveal>

        <Reveal delayMs={150}>
          <h2 className="mt-6 max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight text-noir-text sm:text-5xl md:text-6xl">
            DETAILING
            <br />
            IS A PROCESS.
          </h2>
        </Reveal>

        <Reveal delayMs={300}>
          <p className="mt-6 max-w-lg text-base text-noir-text-secondary md:text-lg">
            Every vehicle follows the same philosophy: inspect carefully,
            prepare thoroughly, correct precisely, protect completely.
          </p>
        </Reveal>

        <div className="relative mt-24 pl-14 md:pl-0">
          <div
            aria-hidden
            className="absolute bottom-2 left-4 top-2 w-px bg-graphite md:bottom-auto md:left-0 md:right-0 md:top-4 md:h-px md:w-auto"
          />
          <div
            ref={fillRef}
            aria-hidden
            className="absolute bottom-2 left-4 top-2 w-px origin-top bg-silver md:bottom-auto md:left-0 md:right-0 md:top-4 md:h-px md:w-auto md:origin-left"
            style={{ transform: "scale(0)" }}
          />

          <div className="grid gap-14 md:grid-cols-4 md:gap-10">
            {STAGES.map((stage, i) => (
              <div key={stage.number} className="relative">
                <span
                  ref={(el) => {
                    badgeRefs.current[i] = el;
                  }}
                  className="absolute -left-14 top-0 flex h-8 w-8 items-center justify-center rounded-full border bg-obsidian text-xs tracking-[0.15em] transition-colors duration-500 md:static md:mb-6 md:inline-flex"
                  style={{ borderColor: MUTED_BORDER, color: MUTED_TEXT }}
                >
                  {stage.number}
                </span>

                <h3
                  ref={(el) => {
                    titleRefs.current[i] = el;
                  }}
                  className="text-lg font-bold tracking-tight transition-colors duration-500 sm:text-xl"
                  style={{ color: MUTED_TEXT }}
                >
                  {stage.title}
                </h3>

                <p className="mt-3 text-sm text-noir-text-secondary md:text-base">
                  {stage.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
