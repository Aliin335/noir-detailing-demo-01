"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={pending}
      className="inline-flex items-center gap-2 border border-graphite px-5 py-2.5 text-xs font-semibold tracking-[0.18em] text-noir-text-secondary transition-colors hover:border-silver hover:text-noir-text disabled:opacity-50"
    >
      {pending ? "REFRESHING…" : "REFRESH"}
    </button>
  );
}
