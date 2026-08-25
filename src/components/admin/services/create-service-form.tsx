"use client";

import { useActionState, useRef } from "react";
import { useRouter } from "next/navigation";

type FormState = { error: string | null };

const initialState: FormState = { error: null };

export function CreateServiceForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);

  const [state, formAction, pending] = useActionState(
    async (_prevState: FormState, formData: FormData): Promise<FormState> => {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          description: formData.get("description"),
          price: Number(formData.get("price")),
          durationMinutes: Number(formData.get("durationMinutes")),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { error: body.message ?? "Something went wrong." };
      }

      formRef.current?.reset();
      router.refresh();
      return { error: null };
    },
    initialState
  );

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-6 border border-graphite p-8 md:grid-cols-2"
    >
      <div>
        <label
          htmlFor="new-service-name"
          className="text-[10px] font-semibold tracking-[0.3em] text-noir-text-secondary"
        >
          NAME
        </label>
        <input
          id="new-service-name"
          name="name"
          type="text"
          required
          className="mt-3 w-full border-b border-graphite bg-transparent pb-2 text-base text-noir-text placeholder:text-noir-text-secondary focus:border-silver focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="new-service-price"
          className="text-[10px] font-semibold tracking-[0.3em] text-noir-text-secondary"
        >
          PRICE (€)
        </label>
        <input
          id="new-service-price"
          name="price"
          type="number"
          min={0}
          step={1}
          required
          className="mt-3 w-full border-b border-graphite bg-transparent pb-2 text-base text-noir-text placeholder:text-noir-text-secondary focus:border-silver focus:outline-none"
        />
      </div>

      <div className="md:col-span-2">
        <label
          htmlFor="new-service-description"
          className="text-[10px] font-semibold tracking-[0.3em] text-noir-text-secondary"
        >
          DESCRIPTION
        </label>
        <textarea
          id="new-service-description"
          name="description"
          required
          rows={2}
          className="mt-3 w-full resize-none border-b border-graphite bg-transparent pb-2 text-base text-noir-text placeholder:text-noir-text-secondary focus:border-silver focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="new-service-duration"
          className="text-[10px] font-semibold tracking-[0.3em] text-noir-text-secondary"
        >
          DURATION (MINUTES)
        </label>
        <input
          id="new-service-duration"
          name="durationMinutes"
          type="number"
          min={1}
          step={1}
          required
          className="mt-3 w-full border-b border-graphite bg-transparent pb-2 text-base text-noir-text placeholder:text-noir-text-secondary focus:border-silver focus:outline-none"
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="md:col-span-2 border-l border-silver pl-3 text-xs font-semibold tracking-[0.1em] text-noir-text-secondary"
        >
          {state.error}
        </p>
      )}

      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="border border-noir-white bg-noir-white px-8 py-3.5 text-xs font-semibold tracking-[0.18em] text-obsidian transition-colors hover:bg-silver disabled:opacity-50"
        >
          {pending ? "CREATING…" : "CREATE SERVICE →"}
        </button>
      </div>
    </form>
  );
}
