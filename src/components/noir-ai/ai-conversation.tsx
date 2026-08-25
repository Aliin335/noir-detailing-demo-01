"use client";

import { useEffect, useReducer, useRef } from "react";
import { useInView } from "@/hooks/use-in-view";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { AiMessage } from "./ai-message";
import type { ChatMessage, Stage } from "./types";

const SESSION_STORAGE_KEY = "noir-ai-session-id";
const TYPING_MESSAGE_ID = "typing-indicator";

/** Stable per-browser-tab id sent with every message so the n8n workflow can
 * keep conversation memory across turns. Persisted in sessionStorage (not
 * localStorage) so it survives a reload of this tab/conversation but doesn't
 * follow the visitor across separate visits. */
function getOrCreateSessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, fresh);
    return fresh;
  } catch {
    // sessionStorage unavailable (e.g. some private-browsing modes) — the
    // conversation still works, it just won't survive a reload.
    return crypto.randomUUID();
  }
}

type State = {
  stage: Stage;
  messages: ChatMessage[];
  nextId: number;
  inputValue: string;
  pending: boolean;
};

const initialState: State = {
  stage: "greeting",
  messages: [],
  nextId: 0,
  inputValue: "",
  pending: false,
};

type Action =
  | { type: "ENTER" }
  | { type: "SET_INPUT"; value: string }
  | { type: "SEND_START"; text: string }
  | { type: "SEND_SUCCESS"; text: string }
  | { type: "SEND_FAILURE"; text: string };

function addMessage(
  state: State,
  role: "ai" | "user",
  text: string
): Pick<State, "messages" | "nextId"> {
  const message: ChatMessage = { id: `m${state.nextId}`, role, kind: "text", text };
  return { messages: [...state.messages, message], nextId: state.nextId + 1 };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ENTER": {
      if (state.messages.length > 0) return state;
      let next = state;
      next = { ...next, ...addMessage(next, "ai", "Hi. I'm NOIR's AI receptionist.") };
      next = {
        ...next,
        ...addMessage(next, "ai", "Tell me about your car and what you'd like to achieve."),
      };
      return next;
    }

    case "SET_INPUT":
      return { ...state, inputValue: action.value };

    // Every message from here on is handled by the n8n AI receptionist —
    // this component no longer decides what to say, it only relays.
    case "SEND_START":
      return {
        ...state,
        ...addMessage(state, "user", action.text),
        inputValue: "",
        pending: true,
        stage: "vehicle_input",
      };

    case "SEND_SUCCESS":
      return { ...state, ...addMessage(state, "ai", action.text), pending: false };

    case "SEND_FAILURE":
      return { ...state, ...addMessage(state, "ai", action.text), pending: false };

    default:
      return state;
  }
}

export function AiConversation({
  onStageChange,
}: {
  onStageChange?: (stage: Stage) => void;
}) {
  const reducedMotion = useReducedMotion();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    if (inView) dispatch({ type: "ENTER" });
  }, [inView]);

  useEffect(() => {
    onStageChange?.(state.stage);
  }, [state.stage, onStageChange]);

  // Auto-scrolls the chat's own latest content into view as the
  // conversation progresses (new message, pending state, etc.) — but not
  // on the component's initial mount, which happens as soon as this
  // section is server-rendered onto the homepage, regardless of whether
  // the visitor has scrolled anywhere near it yet. Without the guard
  // below, that first run still fires (effects always run once after
  // mount) and drags the *whole page* down to this section before the
  // user has done anything.
  //
  // No cleanup resets `isInitialMount` back to `true` — a cleanup here
  // would run before *every* subsequent invocation of this effect (any
  // real dependency change also triggers cleanup-then-rerun, not just
  // React Strict Mode's dev-only mount->cleanup->mount replay), which
  // would re-skip every genuine later scroll and leave the chat's
  // auto-scroll permanently disabled after the first message. The
  // one known trade-off: Strict Mode's dev-only replay of the initial
  // mount calls this effect a second time with `isInitialMount.current`
  // already `false`, firing one extra `scrollIntoView` during that
  // replay — harmless (the anchor is already in view, `block: "nearest"`
  // is a no-op) and confined to local dev, unlike the original bug this
  // replaces.
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    scrollAnchorRef.current?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "nearest",
    });
  }, [state.messages.length, state.pending, reducedMotion]);

  const sendMessage = (text: string) => {
    if (!sessionIdRef.current) sessionIdRef.current = getOrCreateSessionId();
    dispatch({ type: "SEND_START", text });

    fetch("/api/ai/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, sessionId: sessionIdRef.current }),
    })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          dispatch({
            type: "SEND_FAILURE",
            text:
              body.message ??
              "Sorry, I'm having trouble responding right now — please try again.",
          });
          return;
        }
        dispatch({ type: "SEND_SUCCESS", text: body.reply as string });
      })
      .catch(() => {
        dispatch({
          type: "SEND_FAILURE",
          text: "I couldn't reach the receptionist just now — please try again.",
        });
      });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.pending) return; // no duplicate submissions while a request is in flight
    const value = state.inputValue.trim();
    if (!value) return;
    sendMessage(value);
  };

  return (
    <div ref={ref} className="flex flex-col gap-6">
      <div className="flex flex-col gap-6">
        {state.messages.map((message) => (
          <AiMessage key={message.id} message={message} />
        ))}
        {state.pending && (
          <AiMessage
            message={{ id: TYPING_MESSAGE_ID, role: "ai", kind: "text", text: "Typing…" }}
          />
        )}
      </div>

      <form onSubmit={onSubmit} className="border-l border-transparent pl-4 md:pl-6">
        <label htmlFor="ai-input" className="sr-only">
          Your message
        </label>
        <div className="flex items-center gap-4 border-b border-graphite pb-2 focus-within:border-silver">
          <input
            id="ai-input"
            type="text"
            value={state.inputValue}
            disabled={state.pending}
            onChange={(e) => dispatch({ type: "SET_INPUT", value: e.target.value })}
            placeholder="Tell me about your car…"
            className="w-full bg-transparent text-base text-noir-text placeholder:text-noir-text-secondary focus:outline-none disabled:opacity-50 md:text-lg"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={state.pending}
            className="shrink-0 text-noir-text-secondary transition-colors hover:text-noir-text disabled:opacity-50"
          >
            →
          </button>
        </div>
      </form>

      <div ref={scrollAnchorRef} />
    </div>
  );
}
