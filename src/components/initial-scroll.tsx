"use client";

import { useEffect } from "react";

// "auto" would defer to the global `scroll-behavior: smooth` CSS and
// animate; "instant" bypasses it, matching the native browser jump this
// replaces (arriving at a state, as opposed to a user-initiated anchor
// click, which should still animate and is untouched by this).
function applyInitialScroll() {
  const hash = window.location.hash;
  if (!hash) {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    return;
  }
  const target = document.getElementById(hash.slice(1));
  target?.scrollIntoView({ behavior: "instant", block: "start" });
}

/**
 * Takes over the scroll position that the browser would otherwise handle
 * itself, on two occasions:
 *
 * 1. Mount (a fresh load or full reload) — necessary because disabling
 *    `history.scrollRestoration` (see layout.tsx) also suppresses the
 *    browser's own native "jump to #fragment" behavior on load.
 * 2. `popstate` (browser back/forward) — for the same reason: disabling
 *    scroll restoration also stops the browser auto-scrolling on history
 *    traversal, so e.g. going back from `#book` to the hash-less URL no
 *    longer returns to the top on its own.
 *
 * `popstate` only fires for history traversal, never for a plain anchor
 * click, so the existing smooth-scroll click-to-section behavior (native
 * browser "follow hyperlink" + the site's `scroll-behavior: smooth` CSS)
 * is completely unaffected.
 */
export function InitialScroll() {
  useEffect(() => {
    applyInitialScroll();
    window.addEventListener("popstate", applyInitialScroll);
    return () => window.removeEventListener("popstate", applyInitialScroll);
  }, []);

  return null;
}
