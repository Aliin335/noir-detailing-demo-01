"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/lib/auth/actions";

const initialState: LoginState = { error: null };

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div>
        <label
          htmlFor="email"
          className="text-[10px] font-semibold tracking-[0.3em] text-noir-text-secondary"
        >
          EMAIL
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-3 w-full border-b border-graphite bg-transparent pb-2 text-base text-noir-text placeholder:text-noir-text-secondary focus:border-silver focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="text-[10px] font-semibold tracking-[0.3em] text-noir-text-secondary"
        >
          PASSWORD
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-3 w-full border-b border-graphite bg-transparent pb-2 text-base text-noir-text placeholder:text-noir-text-secondary focus:border-silver focus:outline-none"
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="border-l border-silver pl-3 text-xs font-semibold tracking-[0.1em] text-noir-text-secondary"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full border border-noir-white bg-noir-white px-8 py-3.5 text-xs font-semibold tracking-[0.18em] text-obsidian transition-colors hover:bg-silver disabled:opacity-50"
      >
        {pending ? "SIGNING IN…" : "SIGN IN →"}
      </button>
    </form>
  );
}
