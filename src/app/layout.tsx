import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NOIR DETAILING — Automotive Detailing, Refined.",
  description:
    "Premium automotive detailing for vehicles that deserve more. Obsessive, panel-by-panel restoration for cars that deserve better.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-obsidian text-noir-text">
        {/*
          ============================================================
          TEMPORARY DIAGNOSTIC — DO NOT LEAVE IN PRODUCTION
          ============================================================
          Pure observation only: records scroll-affecting activity to
          localStorage so it survives navigation. Does not alter scroll
          position or any application behavior. Runs before every other
          script (including the scrollRestoration script right below it)
          so it can also observe that script's own assignment. Remove
          this entire <Script id="TEMP-scroll-diagnostic"> block once the
          root cause of the initial-scroll bug is identified.
        */}
        <Script id="TEMP-scroll-diagnostic" strategy="beforeInteractive">
          {`
            (function() {
              try {
                var log = JSON.parse(localStorage.getItem('__scrollDiag') || '[]');
                function record(type, extra) {
                  try {
                    var entry = {
                      t: performance.now(),
                      type: type,
                      scrollY: window.scrollY,
                      hash: location.hash,
                      href: location.href,
                      readyState: document.readyState,
                      visibilityState: document.visibilityState
                    };
                    if (extra) { for (var k in extra) { entry[k] = extra[k]; } }
                    log.push(entry);
                    localStorage.setItem('__scrollDiag', JSON.stringify(log));
                  } catch (e) {}
                }
                var navEntry = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {};
                record('script-start', {
                  scrollRestorationSupported: 'scrollRestoration' in history,
                  referrer: document.referrer,
                  navType: navEntry.type,
                  activationStart: navEntry.activationStart
                });

                var o1 = window.scrollTo;
                window.scrollTo = function() {
                  record('scrollTo', { args: JSON.stringify(Array.prototype.slice.call(arguments)), stack: new Error().stack });
                  return o1.apply(this, arguments);
                };
                var o1b = window.scrollBy;
                window.scrollBy = function() {
                  record('scrollBy', { args: JSON.stringify(Array.prototype.slice.call(arguments)), stack: new Error().stack });
                  return o1b.apply(this, arguments);
                };
                var o2 = Element.prototype.scrollIntoView;
                Element.prototype.scrollIntoView = function() {
                  record('scrollIntoView', { el: this.id || this.tagName, stack: new Error().stack });
                  return o2.apply(this, arguments);
                };
                var o3 = history.pushState;
                history.pushState = function() {
                  record('pushState', { args: JSON.stringify(Array.prototype.slice.call(arguments)), stack: new Error().stack });
                  return o3.apply(this, arguments);
                };
                var o4 = history.replaceState;
                history.replaceState = function() {
                  record('replaceState', { args: JSON.stringify(Array.prototype.slice.call(arguments)), stack: new Error().stack });
                  return o4.apply(this, arguments);
                };
                try {
                  var currentRestoration = history.scrollRestoration;
                  Object.defineProperty(history, 'scrollRestoration', {
                    configurable: true,
                    get: function() { return currentRestoration; },
                    set: function(v) {
                      record('scrollRestoration-set', { from: currentRestoration, to: v, stack: new Error().stack });
                      currentRestoration = v;
                    }
                  });
                } catch (e) {
                  record('scrollRestoration-patch-failed', { error: String(e) });
                }

                window.addEventListener('scroll', function() { record('scroll-event'); }, { capture: true });
                window.addEventListener('popstate', function() { record('popstate'); });
                window.addEventListener('pageshow', function(e) { record('pageshow', { persisted: e.persisted }); });
                window.addEventListener('hashchange', function() { record('hashchange'); });
                document.addEventListener('focusin', function(e) {
                  record('focusin', { el: e.target && (e.target.id || e.target.tagName) });
                });
                document.addEventListener('DOMContentLoaded', function() { record('DOMContentLoaded'); });
                window.addEventListener('load', function() { record('window-load'); });

                var lastY = window.scrollY, frames = 0;
                function poll() {
                  if (window.scrollY !== lastY) {
                    record('raf-scrollY-changed', { from: lastY, to: window.scrollY });
                    lastY = window.scrollY;
                  }
                  frames++;
                  if (frames < 240) requestAnimationFrame(poll);
                }
                requestAnimationFrame(poll);

                [100, 500, 1000, 2000].forEach(function(ms) {
                  setTimeout(function() { record('checkpoint-' + ms + 'ms'); }, ms);
                });
              } catch (e) {}
            })();
          `}
        </Script>
        {/*
          The browser's native `history.scrollRestoration` defaults to
          "auto", which silently restores a previous non-zero scroll
          position on reload / session restore — independent of the URL
          hash. That's what caused the site to sometimes open already
          scrolled down to NOIR AI instead of the Hero. Disabling it here,
          as early as possible (before hydration), stops that flash entirely.
          Note this also suppresses the browser's own native "jump to
          #fragment" behavior on load, so `InitialScroll` (mounted on the
          homepage) takes over placing the correct scroll position —
          top, or the requested anchor — explicitly once the DOM is ready.
        */}
        <Script id="disable-scroll-restoration" strategy="beforeInteractive">
          {`
            try {
              if ('scrollRestoration' in history) {
                history.scrollRestoration = 'manual';
              }
            } catch (e) {}
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
