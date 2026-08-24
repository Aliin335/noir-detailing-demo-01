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
