import { appError } from "@/lib/errors";
import { isValidDateString, isValidTimeString } from "@/lib/availability/timezone";

export type CreateBookingInput = {
  customerName: string;
  phone: string;
  email: string;
  vehicleDescription: string;
  serviceId: string;
  date: string;
  startTime: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireString(value: unknown, field: string, min: number, max: number): string {
  if (typeof value !== "string") {
    throw appError("INVALID_INPUT", `"${field}" is required.`);
  }
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    throw appError(
      "INVALID_INPUT",
      `"${field}" must be between ${min} and ${max} characters.`
    );
  }
  return trimmed;
}

/**
 * Validates the raw request body shape and content. Does NOT check the
 * service exists/is active, business hours, or availability — those need
 * a database round-trip and live in create-booking.ts, after this passes.
 */
export function parseCreateBookingInput(body: unknown): CreateBookingInput {
  if (typeof body !== "object" || body === null) {
    throw appError("INVALID_INPUT", "Request body must be a JSON object.");
  }
  const b = body as Record<string, unknown>;

  const customerName = requireString(b.customerName, "customerName", 2, 100);
  const phone = requireString(b.phone, "phone", 5, 30);
  const email = requireString(b.email, "email", 5, 200);
  if (!EMAIL_PATTERN.test(email)) {
    throw appError("INVALID_INPUT", '"email" is not a valid email address.');
  }
  const vehicleDescription = requireString(b.vehicleDescription, "vehicleDescription", 3, 300);
  const serviceId = requireString(b.serviceId, "serviceId", 1, 100);

  const date = requireString(b.date, "date", 10, 10);
  if (!isValidDateString(date)) {
    throw appError("INVALID_DATE", `"date" must be a valid YYYY-MM-DD date.`);
  }

  const startTime = requireString(b.startTime, "startTime", 5, 5);
  if (!isValidTimeString(startTime)) {
    throw appError("INVALID_TIME", `"startTime" must be a valid HH:mm time.`);
  }

  return { customerName, phone, email, vehicleDescription, serviceId, date, startTime };
}
