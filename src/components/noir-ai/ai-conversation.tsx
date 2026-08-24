"use client";

import { useEffect, useReducer, useRef } from "react";
import { useInView } from "@/hooks/use-in-view";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { AiActions, type ActionItem } from "./ai-actions";
import { AiMessage } from "./ai-message";
import { BookingConfirmation } from "./booking-confirmation";
import { BookingSummary } from "./booking-summary";
import {
  DAY_LABELS,
  RECOMMENDATION,
  fetchAvailability,
  formatDate,
  formatIsoDate,
  resolveDate,
  submitBooking,
  toIsoDate,
  type AvailabilitySlot,
  type CreateBookingPayload,
} from "./demo-data";
import type { ChatMessage, Day, Stage } from "./types";

type PendingAi = { kind: "text" | "recommendation"; text: string; nextStage: Stage } | null;

type ConfirmedBooking = {
  date: string; // "YYYY-MM-DD", from the server
  startTime: string;
  serviceName: string;
  price: number;
};

type State = {
  stage: Stage;
  messages: ChatMessage[];
  pendingAi: PendingAi;
  pendingAvailability: { date: string } | null;
  pendingBooking: CreateBookingPayload | null;
  nextId: number;
  vehicle: string;
  day: Day | null;
  time: string | null;
  slots: AvailabilitySlot[];
  name: string;
  phone: string;
  email: string;
  inputValue: string;
  confirmedBooking: ConfirmedBooking | null;
};

const initialState: State = {
  stage: "greeting",
  messages: [],
  pendingAi: null,
  pendingAvailability: null,
  pendingBooking: null,
  nextId: 0,
  vehicle: "",
  day: null,
  time: null,
  slots: [],
  name: "",
  phone: "",
  email: "",
  inputValue: "",
  confirmedBooking: null,
};

type Action =
  | { type: "ENTER" }
  | { type: "SET_INPUT"; value: string }
  | { type: "SUBMIT_INPUT" }
  | { type: "QUICK_ACTION"; label: string }
  | { type: "CHECK_AVAILABILITY" }
  | { type: "SELECT_DAY"; day: Day }
  | { type: "AVAILABILITY_LOADED"; slots: AvailabilitySlot[] }
  | { type: "AVAILABILITY_FAILED"; message: string }
  | { type: "SELECT_TIME"; time: string }
  | { type: "EDIT" }
  | { type: "CONFIRM" }
  | { type: "BOOKING_SUCCEEDED"; booking: ConfirmedBooking }
  | { type: "BOOKING_CONFLICT" }
  | { type: "BOOKING_FAILED"; message: string }
  | { type: "RESOLVE_PENDING" };

function say(state: State, role: "ai" | "user", text: string, kind: ChatMessage["kind"] = "text") {
  const message: ChatMessage = { id: `m${state.nextId}`, role, kind, text };
  return { messages: [...state.messages, message], nextId: state.nextId + 1 };
}

function requestAvailabilityFor(state: State, day: Day): Partial<State> {
  return {
    day,
    time: null,
    slots: [],
    stage: "checking_availability",
    pendingAvailability: { date: toIsoDate(resolveDate(day)) },
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ENTER": {
      if (state.messages.length > 0) return state;
      let next = state;
      next = { ...next, ...say(next, "ai", "Hi. I'm NOIR's AI receptionist.") };
      next = {
        ...next,
        ...say(next, "ai", "Tell me about your car and what you'd like to achieve."),
      };
      return next;
    }

    case "SET_INPUT":
      return { ...state, inputValue: action.value };

    case "QUICK_ACTION": {
      const withUser = { ...state, ...say(state, "user", action.label) };
      return { ...withUser, stage: "vehicle_input" };
    }

    case "SUBMIT_INPUT": {
      const value = state.inputValue.trim();
      if (!value) return state;
      const withUser = { ...state, ...say(state, "user", value), inputValue: "" };

      switch (state.stage) {
        case "vehicle_input":
          return {
            ...withUser,
            vehicle: value,
            pendingAi: {
              kind: "recommendation",
              text: "Thanks — based on what you've told me, I'd recommend our Full Detail.",
              nextStage: "recommendation_given",
            },
          };
        case "collecting_name":
          return {
            ...withUser,
            name: value,
            pendingAi: { kind: "text", text: "Phone number", nextStage: "collecting_phone" },
          };
        case "collecting_phone":
          return {
            ...withUser,
            phone: value,
            pendingAi: { kind: "text", text: "Email", nextStage: "collecting_email" },
          };
        case "collecting_email":
          return { ...withUser, email: value, stage: "summary" };
        default:
          return state;
      }
    }

    case "CHECK_AVAILABILITY": {
      const withUser = { ...state, ...say(state, "user", "Check availability") };
      return {
        ...withUser,
        pendingAi: {
          kind: "text",
          text: "What day works best for you?",
          nextStage: "date_selection",
        },
      };
    }

    case "SELECT_DAY": {
      const withUser = { ...state, ...say(state, "user", DAY_LABELS[action.day]) };
      return { ...withUser, ...requestAvailabilityFor(withUser, action.day) };
    }

    case "AVAILABILITY_LOADED": {
      const cleared = { ...state, pendingAvailability: null };
      if (action.slots.length === 0) {
        return {
          ...cleared,
          ...say(
            cleared,
            "ai",
            "There's nothing available that day — want to try another day?"
          ),
          stage: "date_selection",
        };
      }
      return {
        ...cleared,
        ...say(cleared, "ai", "Here's what's available:"),
        slots: action.slots,
        stage: "time_selection",
      };
    }

    case "AVAILABILITY_FAILED": {
      const cleared = { ...state, pendingAvailability: null };
      return {
        ...cleared,
        ...say(cleared, "ai", action.message),
        stage: "date_selection",
      };
    }

    case "SELECT_TIME": {
      const withUser = { ...state, ...say(state, "user", action.time) };
      // If contact details were already collected (e.g. re-picking a time
      // after a conflict), don't ask for them again — go straight to the
      // summary instead of back through name/phone/email.
      const hasContactInfo =
        withUser.name.trim() !== "" &&
        withUser.phone.trim() !== "" &&
        withUser.email.trim() !== "";
      return {
        ...withUser,
        time: action.time,
        pendingAi: hasContactInfo
          ? {
              kind: "text",
              text: `Perfect. I'll reserve ${action.time} for your ${RECOMMENDATION.service}.`,
              nextStage: "summary",
            }
          : {
              kind: "text",
              text: `Perfect. I'll reserve ${action.time} for your ${RECOMMENDATION.service}.\n\nWhat's your name?`,
              nextStage: "collecting_name",
            },
      };
    }

    case "EDIT":
      return {
        ...state,
        stage: "collecting_name",
        inputValue: state.name,
        ...say(state, "ai", "No problem — let's update your details.\n\nWhat's your name?"),
      };

    case "CONFIRM": {
      if (!state.day || !state.time) return state;
      const payload: CreateBookingPayload = {
        customerName: state.name,
        phone: state.phone,
        email: state.email,
        vehicleDescription: state.vehicle,
        serviceId: RECOMMENDATION.serviceId,
        date: toIsoDate(resolveDate(state.day)),
        startTime: state.time,
      };
      return { ...state, stage: "submitting_booking", pendingBooking: payload };
    }

    case "BOOKING_SUCCEEDED":
      return {
        ...state,
        pendingBooking: null,
        confirmedBooking: action.booking,
        stage: "confirmed",
      };

    case "BOOKING_CONFLICT": {
      const cleared = { ...state, pendingBooking: null, time: null };
      const withMessage = {
        ...cleared,
        ...say(
          cleared,
          "ai",
          "That time was just taken. Let me show you the next available options."
        ),
      };
      return state.day
        ? { ...withMessage, ...requestAvailabilityFor(withMessage, state.day) }
        : { ...withMessage, stage: "date_selection" };
    }

    case "BOOKING_FAILED": {
      const cleared = { ...state, pendingBooking: null };
      return { ...cleared, ...say(cleared, "ai", action.message), stage: "summary" };
    }

    case "RESOLVE_PENDING": {
      if (!state.pendingAi) return state;
      const { kind, text, nextStage } = state.pendingAi;
      return {
        ...state,
        ...say(state, "ai", text, kind),
        pendingAi: null,
        stage: nextStage,
      };
    }

    default:
      return state;
  }
}

function friendlyAvailabilityError(code: string): string {
  switch (code) {
    case "PAST_DATE":
      return "That date has already passed — want to try another day?";
    case "BUSINESS_CLOSED":
    case "INVALID_DATE":
      return "We're closed that day — want to try another day?";
    case "SERVICE_NOT_FOUND":
      return "That service isn't available right now. Let's try again shortly.";
    case "NETWORK_ERROR":
      return "I couldn't reach the booking system just now — want to try again?";
    default:
      return "Something went wrong checking availability — want to try again?";
  }
}

function friendlyBookingError(code: string): string {
  switch (code) {
    case "PAST_DATE":
    case "PAST_TIME":
      return "That time has already passed. Let's pick another slot.";
    case "BUSINESS_CLOSED":
      return "That slot doesn't fit within business hours. Let's pick another time.";
    case "SERVICE_NOT_FOUND":
      return "That service isn't available right now — sorry about that.";
    case "NETWORK_ERROR":
      return "I couldn't reach the booking system just now — please try again.";
    default:
      return "Something went wrong saving your booking — please try again.";
  }
}

const INPUT_CONFIG: Partial<
  Record<Stage, { placeholder: string; label: string; type?: string; autoComplete?: string }>
> = {
  vehicle_input: { placeholder: "Tell me about your car…", label: "Your message" },
  collecting_name: { placeholder: "Your name", label: "Your name", autoComplete: "name" },
  collecting_phone: {
    placeholder: "Phone number",
    label: "Phone number",
    type: "tel",
    autoComplete: "tel",
  },
  collecting_email: {
    placeholder: "Email",
    label: "Email",
    type: "email",
    autoComplete: "email",
  },
};

export function AiConversation({
  onStageChange,
}: {
  onStageChange?: (stage: Stage) => void;
}) {
  const reducedMotion = useReducedMotion();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (inView) dispatch({ type: "ENTER" });
  }, [inView]);

  useEffect(() => {
    onStageChange?.(state.stage);
  }, [state.stage, onStageChange]);

  useEffect(() => {
    if (!state.pendingAi) return;
    const delay = reducedMotion ? 0 : 450;
    const id = setTimeout(() => dispatch({ type: "RESOLVE_PENDING" }), delay);
    return () => clearTimeout(id);
  }, [state.pendingAi, reducedMotion]);

  // Real availability lookup — see src/app/api/availability/route.ts.
  useEffect(() => {
    if (!state.pendingAvailability) return;
    let cancelled = false;
    fetchAvailability(state.pendingAvailability.date, RECOMMENDATION.serviceId).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        dispatch({ type: "AVAILABILITY_LOADED", slots: result.slots });
      } else {
        dispatch({ type: "AVAILABILITY_FAILED", message: friendlyAvailabilityError(result.code) });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [state.pendingAvailability]);

  // Real booking creation — see src/app/api/bookings/route.ts. The server
  // re-validates and re-checks the slot; a 409 here means someone else took
  // it between the availability check and this confirm.
  useEffect(() => {
    if (!state.pendingBooking) return;
    let cancelled = false;
    submitBooking(state.pendingBooking).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        dispatch({
          type: "BOOKING_SUCCEEDED",
          booking: {
            date: result.booking.date,
            startTime: result.booking.startTime,
            serviceName: result.booking.serviceName,
            price: result.booking.price,
          },
        });
      } else if (result.code === "SLOT_UNAVAILABLE") {
        dispatch({ type: "BOOKING_CONFLICT" });
      } else {
        dispatch({ type: "BOOKING_FAILED", message: friendlyBookingError(result.code) });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [state.pendingBooking]);

  // Auto-scrolls the chat's own latest content into view as the
  // conversation progresses (new message, stage change, etc.) — but not
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
  }, [state.messages.length, state.stage, reducedMotion]);

  const inputConfig = INPUT_CONFIG[state.stage];
  const showInput = Boolean(inputConfig) && !state.pendingAi;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "SUBMIT_INPUT" });
  };

  let actions: ActionItem[] = [];
  if (!state.pendingAi) {
    if (state.stage === "greeting") {
      actions = [
        { label: "BOOK AN APPOINTMENT", onClick: () => dispatch({ type: "QUICK_ACTION", label: "Book an appointment" }) },
        { label: "EXPLORE SERVICES", onClick: () => { window.location.hash = "services"; } },
        { label: "GET A RECOMMENDATION", onClick: () => dispatch({ type: "QUICK_ACTION", label: "Get a recommendation" }) },
      ];
    } else if (state.stage === "recommendation_given") {
      actions = [
        { label: "CHECK AVAILABILITY", arrow: true, onClick: () => dispatch({ type: "CHECK_AVAILABILITY" }) },
      ];
    } else if (state.stage === "date_selection") {
      actions = (Object.keys(DAY_LABELS) as Day[]).map((day) => ({
        label: DAY_LABELS[day],
        onClick: () => dispatch({ type: "SELECT_DAY", day }),
      }));
    } else if (state.stage === "time_selection") {
      actions = state.slots.map((slot) => ({
        label: slot.start,
        selected: state.time === slot.start,
        onClick: () => dispatch({ type: "SELECT_TIME", time: slot.start }),
      }));
    }
  }

  return (
    <div ref={ref} className="flex flex-col gap-6">
      <div className="flex flex-col gap-6">
        {state.messages.map((message) => (
          <AiMessage key={message.id} message={message} />
        ))}
      </div>

      {actions.length > 0 && (
        <AiActions
          items={actions}
          heading={
            state.stage === "time_selection" && state.day
              ? DAY_LABELS[state.day]
              : undefined
          }
        />
      )}

      {state.stage === "summary" && (
        <BookingSummary
          vehicle={state.vehicle}
          service={RECOMMENDATION.service}
          date={state.day ? formatDate(resolveDate(state.day)) : ""}
          time={state.time ?? ""}
          price={RECOMMENDATION.price}
          name={state.name}
          phone={state.phone}
          email={state.email}
          onConfirm={() => dispatch({ type: "CONFIRM" })}
          onEdit={() => dispatch({ type: "EDIT" })}
        />
      )}

      {state.stage === "confirmed" && state.confirmedBooking && (
        <BookingConfirmation
          vehicle={state.vehicle}
          service={state.confirmedBooking.serviceName}
          date={formatIsoDate(state.confirmedBooking.date)}
          time={state.confirmedBooking.startTime}
          price={`€${state.confirmedBooking.price}`}
        />
      )}

      {showInput && inputConfig && (
        <form onSubmit={onSubmit} className="border-l border-transparent pl-4 md:pl-6">
          <label htmlFor="ai-input" className="sr-only">
            {inputConfig.label}
          </label>
          <div className="flex items-center gap-4 border-b border-graphite pb-2 focus-within:border-silver">
            <input
              id="ai-input"
              type={inputConfig.type ?? "text"}
              autoComplete={inputConfig.autoComplete}
              value={state.inputValue}
              onChange={(e) => dispatch({ type: "SET_INPUT", value: e.target.value })}
              placeholder={inputConfig.placeholder}
              className="w-full bg-transparent text-base text-noir-text placeholder:text-noir-text-secondary focus:outline-none md:text-lg"
            />
            <button
              type="submit"
              aria-label="Send"
              className="shrink-0 text-noir-text-secondary transition-colors hover:text-noir-text"
            >
              →
            </button>
          </div>
        </form>
      )}

      <div ref={scrollAnchorRef} />
    </div>
  );
}
