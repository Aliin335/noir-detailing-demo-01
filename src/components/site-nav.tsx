"use client";

import { useEffect, useRef, useState } from "react";
import { NoirLogo } from "./noir-logo";

const LINKS = [
  { label: "SERVICES", href: "#services" },
  { label: "PROCESS", href: "#process" },
  { label: "GALLERY", href: "#gallery" },
  { label: "ABOUT", href: "#about" },
];

export function SiteNav() {
  const [solid, setSolid] = useState(false);
  const tickingRef = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(() => {
        setSolid(window.scrollY > 24);
        tickingRef.current = false;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        solid
          ? "bg-obsidian/85 backdrop-blur-md border-b border-graphite/60"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-10">
        <a href="#top" aria-label="NOIR Detailing home">
          <NoirLogo />
        </a>

        <ul className="hidden items-center gap-10 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-xs font-medium tracking-[0.18em] text-noir-text-secondary transition-colors hover:text-noir-text"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#book"
          className="rounded-none border border-silver/70 px-5 py-2.5 text-xs font-semibold tracking-[0.18em] text-noir-text transition-colors hover:border-noir-white hover:bg-noir-white hover:text-obsidian"
        >
          BOOK A DETAIL
        </a>
      </nav>
    </header>
  );
}
