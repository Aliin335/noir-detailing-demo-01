"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { RECOMMENDATION } from "./demo-data";
import type { ChatMessage } from "./types";

export function AiMessage({ message }: { message: ChatMessage }) {
  const reducedMotion = useReducedMotion();
  const [shown, setShown] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion) return;
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [reducedMotion]);

  const isAi = message.role === "ai";

  return (
    <div
      className={`border-l pl-4 transition-[opacity,transform] duration-500 ease-out md:pl-6 ${
        isAi ? "border-graphite" : "border-silver"
      } ${shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
    >
      <p className="text-[10px] font-semibold tracking-[0.25em] text-noir-text-secondary">
        {isAi ? "NOIR AI" : "YOU"}
      </p>

      {message.kind === "recommendation" ? (
        <div className="mt-2 max-w-md">
          <p className="text-base text-noir-text md:text-lg">{message.text}</p>
          <p className="mt-4 text-sm font-semibold tracking-[0.1em] text-noir-text">
            {RECOMMENDATION.service}
          </p>
          <ul className="mt-3 space-y-1.5">
            {RECOMMENDATION.items.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 text-sm text-noir-text-secondary"
              >
                <span aria-hidden className="h-px w-4 bg-graphite" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-noir-text-secondary">
            {RECOMMENDATION.price}
            <span aria-hidden className="mx-2">
              ·
            </span>
            {RECOMMENDATION.duration}
          </p>
          <p className="mt-4 text-base text-noir-text md:text-lg">
            Would you like me to check availability?
          </p>
        </div>
      ) : (
        <p className="mt-2 max-w-md whitespace-pre-line text-base text-noir-text md:text-lg">
          {message.text}
        </p>
      )}
    </div>
  );
}
