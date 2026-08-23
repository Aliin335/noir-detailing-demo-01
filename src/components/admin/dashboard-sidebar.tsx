"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/auth/actions";

const LINKS = [
  { href: "/admin", label: "OVERVIEW" },
  { href: "/admin/appointments", label: "APPOINTMENTS" },
  { href: "/admin/services", label: "SERVICES" },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-graphite lg:bg-charcoal lg:px-8 lg:py-10">
        <div>
          <p className="text-sm font-semibold tracking-[0.3em] text-noir-text">NOIR</p>
          <p className="mt-1 text-[10px] font-semibold tracking-[0.3em] text-noir-text-secondary">
            ADMIN
          </p>
        </div>

        <nav className="mt-16 flex flex-col gap-1">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`border-l py-2 pl-4 text-xs font-semibold tracking-[0.15em] transition-colors ${
                  active
                    ? "border-silver text-noir-text"
                    : "border-transparent text-noir-text-secondary hover:text-noir-text"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-graphite pt-6">
          <p className="text-xs font-semibold tracking-[0.15em] text-noir-text">
            NOIR DETAILING
          </p>
          <p className="mt-1 text-[10px] tracking-[0.2em] text-noir-text-secondary">
            DEMO MODE
          </p>
          <form action={logoutAction} className="mt-4">
            <button
              type="submit"
              className="text-[10px] font-semibold tracking-[0.2em] text-noir-text-secondary transition-colors hover:text-noir-text"
            >
              SIGN OUT
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile / tablet top nav */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-graphite bg-obsidian/95 px-6 py-4 backdrop-blur lg:hidden">
        <div>
          <p className="text-xs font-semibold tracking-[0.3em] text-noir-text">NOIR ADMIN</p>
        </div>
        <nav className="flex items-center gap-5">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[10px] font-semibold tracking-[0.15em] transition-colors ${
                  active ? "text-noir-text" : "text-noir-text-secondary hover:text-noir-text"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-[10px] font-semibold tracking-[0.15em] text-noir-text-secondary transition-colors hover:text-noir-text"
            >
              SIGN OUT
            </button>
          </form>
        </nav>
      </header>
    </>
  );
}
