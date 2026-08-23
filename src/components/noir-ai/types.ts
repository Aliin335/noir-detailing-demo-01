export type ChatMessage = {
  id: string;
  role: "ai" | "user";
  kind: "text" | "recommendation";
  text: string;
};

export type Day = "today" | "tomorrow" | "weekend";

export type Stage =
  | "greeting"
  | "vehicle_input"
  | "recommendation_given"
  | "date_selection"
  | "checking_availability"
  | "time_selection"
  | "collecting_name"
  | "collecting_phone"
  | "collecting_email"
  | "summary"
  | "submitting_booking"
  | "confirmed";

export type ContactInfo = {
  vehicle: string;
  day: Day | null;
  time: string | null;
  name: string;
  phone: string;
  email: string;
};

/** Coarse grouping of `Stage` for the subtle progress indicator. */
export type ProgressStep = "detail" | "time" | "details" | "confirm";

export function stageToProgressStep(stage: Stage): ProgressStep {
  switch (stage) {
    case "greeting":
    case "vehicle_input":
    case "recommendation_given":
      return "detail";
    case "date_selection":
    case "checking_availability":
    case "time_selection":
      return "time";
    case "collecting_name":
    case "collecting_phone":
    case "collecting_email":
      return "details";
    case "summary":
    case "submitting_booking":
    case "confirmed":
      return "confirm";
  }
}
