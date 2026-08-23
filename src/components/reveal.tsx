"use client";

import type { ReactNode } from "react";
import { useInView } from "@/hooks/use-in-view";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function Reveal({
  children,
  delayMs = 0,
  scale = false,
  className,
}: {
  children: ReactNode;
  delayMs?: number;
  /** Also scale in from 0.98 -> 1, on top of the fade + translate. */
  scale?: boolean;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>();
  const shown = reducedMotion || inView;

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-[900ms] ease-out ${
        shown
          ? "translate-y-0 scale-100 opacity-100"
          : `translate-y-6 opacity-0 ${scale ? "scale-[0.98]" : ""}`
      } ${className ?? ""}`}
      style={{ transitionDelay: shown ? `${delayMs}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
