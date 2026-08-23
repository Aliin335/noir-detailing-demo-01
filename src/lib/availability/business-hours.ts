import { timeToMinutes } from "./timezone";

export type BusinessHours = { open: string; close: string } | null;

/** Keyed by weekday: 0 = Sunday ... 6 = Saturday. `null` means closed. */
const WEEKLY_SCHEDULE: Record<number, BusinessHours> = {
  0: null, // Sunday — closed
  1: { open: "09:00", close: "18:00" },
  2: { open: "09:00", close: "18:00" },
  3: { open: "09:00", close: "18:00" },
  4: { open: "09:00", close: "18:00" },
  5: { open: "09:00", close: "18:00" },
  6: { open: "09:00", close: "16:00" },
};

export function businessHoursFor(weekday: number): BusinessHours {
  return WEEKLY_SCHEDULE[weekday] ?? null;
}

/** Whether a service of `durationMinutes` starting at `startTime` fits before closing. */
export function fitsWithinBusinessHours(
  hours: BusinessHours,
  startTime: string,
  durationMinutes: number
): boolean {
  if (!hours) return false;
  const start = timeToMinutes(startTime);
  const end = start + durationMinutes;
  return start >= timeToMinutes(hours.open) && end <= timeToMinutes(hours.close);
}
