"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type ScrubState = {
  eyebrow: string;
  lines: [string, string];
};

const STATES: ScrubState[] = [
  { eyebrow: "STATE 01", lines: ["IT STARTS", "WITH THE SURFACE."] },
  { eyebrow: "STATE 02", lines: ["REMOVE WHAT", "THE EYE CAN'T SEE."] },
  { eyebrow: "STATE 03", lines: ["EVERY PANEL.", "EVERY DETAIL."] },
  { eyebrow: "STATE 04", lines: ["RESTORE", "THE FINISH."] },
  { eyebrow: "STATE 05", lines: ["THE DIFFERENCE", "IS IN THE DETAILS."] },
  { eyebrow: "STATE 06", lines: ["READY", "FOR THE ROAD."] },
];

// Web-optimized proxy: all-intra (every frame is a keyframe) + faststart,
// re-encoded from the 4K/60fps master specifically so arbitrary-time seeks
// during scroll-scrub are cheap. See public/assets/noir-detailing.mp4 for
// the untouched master.
const SCRUB_VIDEO_SRC = "/assets/noir-detailing-scrub.mp4";

// Total scroll runway for the pinned section, expressed as viewport-heights.
// The section is (100 + RUNWAY_VH)vh tall; the inner frame stays pinned for
// the full RUNWAY_VH of scrolling while progress goes 0 -> 1.
const RUNWAY_VH = 500;
const SMOOTHING = 0.16;
const SETTLE_EPSILON = 0.0005;
const MIN_SEEK_DELTA = 0.008;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Fade-in / hold / fade-out / drift window for one of the six narrative states. */
function computeStateVisual(progress: number, index: number) {
  const segment = 1 / STATES.length;
  const start = index * segment;
  const end = start + segment;
  const fade = segment * 0.3;

  if (progress <= start) return { opacity: 0, translate: 16 };
  if (progress < start + fade) {
    const t = (progress - start) / fade;
    return { opacity: t, translate: 16 * (1 - t) };
  }
  if (progress <= end - fade) return { opacity: 1, translate: 0 };
  if (progress < end) {
    const t = (progress - (end - fade)) / fade;
    return { opacity: 1 - t, translate: -16 * t };
  }
  return { opacity: 0, translate: -16 };
}

export function ScrollScrubVideo() {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stateRefs = useRef<(HTMLDivElement | null)[]>([]);
  const railRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const targetProgress = useRef(0);
  const currentProgress = useRef(0);
  const rafId = useRef<number | null>(null);
  const durationRef = useRef(0);
  const pendingSeekTime = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion) return;

    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;

    video.pause();

    // A <video> element that starts off-screen (this section sits well
    // below the fold) gets its `preload` hint silently downgraded by
    // Chrome's data-saving heuristics, and it does NOT retroactively start
    // loading once scrolled into view — so `video.currentTime` assignments
    // land on an element that never has any data to seek into. Bypassing
    // the media element's own network stack with a plain `fetch` (which
    // isn't subject to that heuristic) and handing it an in-memory Blob URL
    // sidesteps this entirely, and as a side benefit every subsequent seek
    // is a pure in-memory decode with zero network latency.
    const controller = new AbortController();
    let objectUrl: string | null = null;

    fetch(SCRUB_VIDEO_SRC, { signal: controller.signal })
      .then((res) => res.blob())
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        video.src = objectUrl;
        video.load();
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.error("[scroll-scrub] failed to preload video", err);
        }
      });

    // Never let more than one seek be in flight: if a seek is already
    // running, remember the latest requested time and apply it once the
    // current seek finishes (via the `seeked` handler below). Without this
    // gate, a fast scroll issues a new currentTime every animation frame,
    // the decoder never finishes a seek before the next one preempts it,
    // and the video appears static.
    const requestSeek = (time: number) => {
      const duration = durationRef.current;
      if (!duration) {
        pendingSeekTime.current = time;
        return;
      }
      const clamped = clamp(time, 0, duration);
      if (video.seeking) {
        pendingSeekTime.current = clamped;
        return;
      }
      if (Math.abs(video.currentTime - clamped) < MIN_SEEK_DELTA) return;
      video.currentTime = clamped;
    };

    // A video's duration can become known via any of these depending on the
    // browser — listen to all three rather than assuming `loadedmetadata`
    // alone is sufficient.
    const captureDuration = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        durationRef.current = video.duration;
        if (pendingSeekTime.current != null) {
          const time = pendingSeekTime.current;
          pendingSeekTime.current = null;
          requestSeek(time);
        }
      }
    };
    if (video.readyState >= 1) captureDuration();
    video.addEventListener("loadedmetadata", captureDuration);
    video.addEventListener("durationchange", captureDuration);
    video.addEventListener("canplay", captureDuration);

    const onSeeked = () => {
      if (pendingSeekTime.current == null) return;
      const time = pendingSeekTime.current;
      pendingSeekTime.current = null;
      requestSeek(time);
    };
    video.addEventListener("seeked", onSeeked);

    const updateTarget = () => {
      const rect = section.getBoundingClientRect();
      const runway = rect.height - window.innerHeight;
      const raw = runway > 0 ? -rect.top / runway : 0;
      targetProgress.current = clamp(raw, 0, 1);
    };

    const applyProgress = (progress: number) => {
      requestSeek(progress * (durationRef.current || 0));

      STATES.forEach((_, index) => {
        const el = stateRefs.current[index];
        if (!el) return;
        const { opacity, translate } = computeStateVisual(progress, index);
        el.style.opacity = String(opacity);
        el.style.transform = `translateY(${translate}px)`;
      });

      const activeIndex = Math.min(
        STATES.length - 1,
        Math.floor(progress * STATES.length)
      );
      railRefs.current.forEach((el, index) => {
        if (!el) return;
        el.style.opacity = index === activeIndex ? "1" : "0.25";
      });
    };

    const loop = () => {
      const current = currentProgress.current;
      const target = targetProgress.current;
      const next = current + (target - current) * SMOOTHING;
      const settled = Math.abs(target - next) < SETTLE_EPSILON;
      currentProgress.current = settled ? target : next;
      applyProgress(currentProgress.current);

      if (!settled) {
        rafId.current = requestAnimationFrame(loop);
      } else {
        rafId.current = null;
      }
    };

    const requestLoop = () => {
      if (rafId.current == null) {
        rafId.current = requestAnimationFrame(loop);
      }
    };

    const onScroll = () => {
      updateTarget();
      requestLoop();
    };

    const onResize = () => {
      updateTarget();
      requestLoop();
    };

    updateTarget();
    currentProgress.current = targetProgress.current;
    applyProgress(currentProgress.current);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      video.removeEventListener("loadedmetadata", captureDuration);
      video.removeEventListener("durationchange", captureDuration);
      video.removeEventListener("canplay", captureDuration);
      video.removeEventListener("seeked", onSeeked);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
  }, [reducedMotion]);

  if (reducedMotion) {
    return (
      <section className="bg-obsidian px-6 py-24 md:px-10">
        <div className="mx-auto max-w-5xl">
          <video
            src={SCRUB_VIDEO_SRC}
            className="aspect-video w-full bg-charcoal object-cover"
            muted
            playsInline
            controls
            preload="metadata"
          />
          <ol className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2">
            {STATES.map((state) => (
              <li key={state.eyebrow}>
                <p className="text-[10px] font-semibold tracking-[0.3em] text-noir-text-secondary">
                  {state.eyebrow}
                </p>
                <p className="mt-3 text-2xl font-bold leading-tight tracking-tight text-noir-text">
                  {state.lines[0]}
                  <br />
                  {state.lines[1]}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      style={{ height: `${100 + RUNWAY_VH}vh` }}
      className="relative bg-obsidian"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover object-center max-md:object-[62%_center]"
          muted
          playsInline
          preload="auto"
          aria-hidden
        />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-obsidian/85 via-obsidian/10 to-obsidian/50"
        />

        <div className="absolute inset-0 flex items-center justify-center px-6">
          {STATES.map((state, index) => (
            <div
              key={state.eyebrow}
              ref={(el) => {
                stateRefs.current[index] = el;
              }}
              className="absolute flex flex-col items-center text-center opacity-0"
            >
              <p className="text-[10px] font-semibold tracking-[0.4em] text-silver">
                {state.eyebrow}
              </p>
              <p className="mt-4 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-noir-text sm:text-5xl md:text-6xl">
                {state.lines[0]}
                <br />
                {state.lines[1]}
              </p>
            </div>
          ))}
        </div>

        <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-2">
          {STATES.map((state, index) => (
            <span
              key={state.eyebrow}
              ref={(el) => {
                railRefs.current[index] = el;
              }}
              className="h-px w-8 bg-silver opacity-25 transition-opacity duration-300"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
