import { appError } from "@/lib/errors";

export type CreateServiceInput = {
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
};
export type UpdateServiceInput = CreateServiceInput;

// name/description bounds mirror bookings/validation.ts's style of always
// having explicit min/max. The price/durationMinutes ceilings are not a
// business rule — they only exist to reject values that would otherwise
// overflow Postgres's Int32 column and surface as an unhandled 500 instead
// of a clean 400.
const NAME_MAX = 200;
const DESCRIPTION_MAX = 2000;
const INT32_MAX = 2_147_483_647;

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

function requireNonNegativeInt(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > INT32_MAX) {
    throw appError("INVALID_INPUT", `"${field}" must be a non-negative whole number.`);
  }
  return value;
}

function requirePositiveInt(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0 || value > INT32_MAX) {
    throw appError("INVALID_INPUT", `"${field}" must be a positive whole number.`);
  }
  return value;
}

function parseServiceFields(body: unknown): CreateServiceInput {
  if (typeof body !== "object" || body === null) {
    throw appError("INVALID_INPUT", "Request body must be a JSON object.");
  }
  const b = body as Record<string, unknown>;
  return {
    name: requireString(b.name, "name", 1, NAME_MAX),
    description: requireString(b.description, "description", 1, DESCRIPTION_MAX),
    price: requireNonNegativeInt(b.price, "price"),
    durationMinutes: requirePositiveInt(b.durationMinutes, "durationMinutes"),
  };
}

/** Validates the raw request body for creating a service. Never reads/
 * trusts an id or active field from the client — see mutations.ts. */
export function parseCreateServiceInput(body: unknown): CreateServiceInput {
  return parseServiceFields(body);
}

/** Validates the raw request body for a full-field edit. Same shape as
 * create — id and active are never part of this input. */
export function parseUpdateServiceInput(body: unknown): UpdateServiceInput {
  return parseServiceFields(body);
}

export function parseSetActiveInput(body: unknown): boolean {
  if (typeof body !== "object" || body === null) {
    throw appError("INVALID_INPUT", "Request body must be a JSON object.");
  }
  const active = (body as Record<string, unknown>).active;
  if (typeof active !== "boolean") {
    throw appError("INVALID_INPUT", `"active" must be a boolean.`);
  }
  return active;
}
