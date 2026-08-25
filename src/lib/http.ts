import { NextResponse } from "next/server";
import { AppError } from "./errors";

/**
 * Converts a thrown error into a safe JSON response. AppError carries a
 * stable code/status meant for clients; anything else (a raw database
 * error, an unexpected exception) is logged server-side and reduced to an
 * opaque 500 — we never leak internals (query text, stack traces, driver
 * error messages) to the response body.
 */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof AppError) {
    return NextResponse.json(
      { error: err.code, message: err.message },
      { status: err.status, headers: err.headers }
    );
  }
  console.error("[api] unexpected error:", err);
  return NextResponse.json(
    { error: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
    { status: 500 }
  );
}
