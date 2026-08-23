"use client";

import { useState } from "react";
import { Reveal } from "../reveal";
import { AiConversation } from "./ai-conversation";
import { stageToProgressStep, type ProgressStep, type Stage } from "./types";

const PROGRESS_STEPS: { key: ProgressStep; number: string; label: string }[] = [
  { key: "detail", number: "01", label: "DETAIL" },
  { key: "time", number: "02", label: "TIME" },
  { key: "details", number: "03", label: "DETAILS" },
  { key: "confirm", number: "04", label: "CONFIRM" },
];

export function NoirAiSection() {
  const [stage, setStage] = useState<Stage>("greeting");
  const activeStep = stageToProgressStep(stage);

  return (
    <section
      id="book"
      className="relative bg-obsidian px-6 py-32 md:px-10"
      style={{ minHeight: "120vh" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-charcoal/40"
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.5em] text-noir-text-secondary">
            NOIR AI
          </p>
        </Reveal>

        <Reveal delayMs={150}>
          <h2 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-noir-text sm:text-5xl md:text-6xl">
            LET&apos;S FIND
            <br />
            THE RIGHT DETAIL.
          </h2>
        </Reveal>

        <Reveal delayMs={300}>
          <p className="mt-6 text-base text-noir-text-secondary md:text-lg">
            Tell me about your car and I&apos;ll help you find the right
            service.
          </p>
        </Reveal>
      </div>

      <div className="relative mx-auto mt-20 grid max-w-6xl gap-16 lg:grid-cols-[minmax(0,300px)_1fr] lg:gap-20">
        <Reveal>
          <div className="lg:sticky lg:top-28">
            <p className="text-xs font-semibold tracking-[0.5em] text-noir-text-secondary">
              NOIR AI
            </p>
            <h3 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-noir-text">
              YOUR PERSONAL
              <br />
              DETAILING ASSISTANT
            </h3>

            <div className="mt-6 flex items-center gap-2">
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-silver"
              />
              <span className="text-[10px] font-semibold tracking-[0.25em] text-noir-text-secondary">
                ONLINE
              </span>
            </div>

            <ol className="mt-16 space-y-5 border-t border-graphite pt-8">
              {PROGRESS_STEPS.map((step) => {
                const isActive = step.key === activeStep;
                return (
                  <li
                    key={step.key}
                    className={`flex items-center gap-3 text-xs font-semibold tracking-[0.2em] transition-colors duration-500 ${
                      isActive ? "text-noir-text" : "text-graphite"
                    }`}
                  >
                    <span>{step.number}</span>
                    <span>{step.label}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </Reveal>

        <Reveal delayMs={150}>
          <AiConversation onStageChange={setStage} />
        </Reveal>
      </div>
    </section>
  );
}
