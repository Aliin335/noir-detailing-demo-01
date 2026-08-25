"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Service } from "@/lib/services";

export function ServiceRow({ service, index }: { service: Service; index: number }) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleEditSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    const res = await fetch(`/api/admin/services/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        description: formData.get("description"),
        price: Number(formData.get("price")),
        durationMinutes: Number(formData.get("durationMinutes")),
      }),
    });

    setPending(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.message ?? "Something went wrong.");
      return;
    }

    setMode("view");
    router.refresh();
  }

  async function handleToggleActive() {
    setPending(true);
    setError(null);

    const res = await fetch(`/api/admin/services/${service.id}/active`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !service.active }),
    });

    setPending(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.message ?? "Something went wrong.");
      return;
    }

    router.refresh();
  }

  if (mode === "edit") {
    return (
      <div className="border-b border-graphite py-8">
        <form action={handleEditSubmit} className="grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor={`edit-name-${service.id}`}
              className="text-[10px] font-semibold tracking-[0.3em] text-noir-text-secondary"
            >
              NAME
            </label>
            <input
              id={`edit-name-${service.id}`}
              name="name"
              type="text"
              defaultValue={service.name}
              required
              className="mt-3 w-full border-b border-graphite bg-transparent pb-2 text-base text-noir-text focus:border-silver focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor={`edit-price-${service.id}`}
              className="text-[10px] font-semibold tracking-[0.3em] text-noir-text-secondary"
            >
              PRICE (€)
            </label>
            <input
              id={`edit-price-${service.id}`}
              name="price"
              type="number"
              min={0}
              step={1}
              defaultValue={service.price}
              required
              className="mt-3 w-full border-b border-graphite bg-transparent pb-2 text-base text-noir-text focus:border-silver focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor={`edit-description-${service.id}`}
              className="text-[10px] font-semibold tracking-[0.3em] text-noir-text-secondary"
            >
              DESCRIPTION
            </label>
            <textarea
              id={`edit-description-${service.id}`}
              name="description"
              defaultValue={service.description}
              required
              rows={2}
              className="mt-3 w-full resize-none border-b border-graphite bg-transparent pb-2 text-base text-noir-text focus:border-silver focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor={`edit-duration-${service.id}`}
              className="text-[10px] font-semibold tracking-[0.3em] text-noir-text-secondary"
            >
              DURATION (MINUTES)
            </label>
            <input
              id={`edit-duration-${service.id}`}
              name="durationMinutes"
              type="number"
              min={1}
              step={1}
              defaultValue={service.durationMinutes}
              required
              className="mt-3 w-full border-b border-graphite bg-transparent pb-2 text-base text-noir-text focus:border-silver focus:outline-none"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="md:col-span-2 border-l border-silver pl-3 text-xs font-semibold tracking-[0.1em] text-noir-text-secondary"
            >
              {error}
            </p>
          )}

          <div className="flex gap-4 md:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="border border-noir-white bg-noir-white px-8 py-3.5 text-xs font-semibold tracking-[0.18em] text-obsidian transition-colors hover:bg-silver disabled:opacity-50"
            >
              {pending ? "SAVING…" : "SAVE"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("view");
                setError(null);
              }}
              disabled={pending}
              className="border border-graphite px-8 py-3.5 text-xs font-semibold tracking-[0.18em] text-noir-text-secondary transition-colors hover:border-silver hover:text-noir-text disabled:opacity-50"
            >
              CANCEL
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="grid gap-3 border-b border-graphite py-8 md:grid-cols-[80px_1fr_auto_auto] md:items-center md:gap-10">
      <span className="text-sm tracking-[0.3em] text-noir-text-secondary">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div>
        <h3 className="text-xl font-bold tracking-tight text-noir-text">{service.name}</h3>
        <p className="mt-2 max-w-md text-sm text-noir-text-secondary">{service.description}</p>
        {!service.active && (
          <p className="mt-2 text-[10px] font-semibold tracking-[0.2em] text-graphite">
            INACTIVE
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mt-2 text-xs font-semibold tracking-[0.1em] text-noir-text-secondary"
          >
            {error}
          </p>
        )}
        <div className="mt-4 flex gap-4">
          <button
            type="button"
            onClick={() => setMode("edit")}
            className="text-[10px] font-semibold tracking-[0.2em] text-noir-text-secondary transition-colors hover:text-noir-text"
          >
            EDIT
          </button>
          <button
            type="button"
            onClick={handleToggleActive}
            disabled={pending}
            className="text-[10px] font-semibold tracking-[0.2em] text-noir-text-secondary transition-colors hover:text-noir-text disabled:opacity-50"
          >
            {pending ? "…" : service.active ? "DEACTIVATE" : "ACTIVATE"}
          </button>
        </div>
      </div>
      <span className="text-lg font-semibold text-noir-text">€{service.price}</span>
      <span className="text-sm text-noir-text-secondary">{service.durationMinutes} min</span>
    </div>
  );
}
