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
 * itself, on three occasions:
 *
 * 1. Mount (a fresh load or full reload) — necessary because disabling
 *    `history.scrollRestoration` (see layout.tsx) also suppresses the
 *    browser's own native "jump to #fragment" behavior on load.
 * 2. `popstate` (browser back/forward within this document) — for the
 *    same reason: disabling scroll restoration also stops the browser
 *    auto-scrolling on history traversal, so e.g. going back from `#book`
 *    to the hash-less URL no longer returns to the top on its own.
 * 3. `pageshow` with `event.persisted` (restored from the browser's
 *    back/forward cache — bfcache) — a *different* mechanism from either
 *    of the above: mobile browsers routinely freeze a backgrounded tab
 *    and instantly thaw it later (switching apps, locking the screen,
 *    reopening the browser) without any script re-running at all, not
 *    even this component's mount effect. The frozen snapshot keeps
 *    whatever scroll position existed when it was backgrounded, which is
 *    what caused the site to keep reopening scrolled down on a real
 *    phone even with the mount/popstate handling above already in place.
 *    `pageshow` is the standard, cross-browser signal for this restore.
 *
 * `popstate` and `pageshow` never fire for a plain anchor click, so the
 * existing smooth-scroll click-to-section behavior (native browser
 * "follow hyperlink" + the site's `scroll-behavior: smooth` CSS) is
 * completely unaffected.
 */
export function InitialScroll() {
  useEffect(() => {
    applyInitialScroll();

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) applyInitialScroll();
    };

    window.addEventListener("popstate", applyInitialScroll);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("popstate", applyInitialScroll);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return null;
}
