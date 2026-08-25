import { NextResponse, type NextRequest } from "next/server";
import { createBooking } from "@/lib/bookings";
import { checkAutomationApiKey, getBearerToken } from "@/lib/auth/service-auth";
import { getClientIp, rateLimiters } from "@/lib/rate-limit";
import { errorResponse } from "@/lib/http";
import { appError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    // Rate limit before checking key validity: if the 401 ran first, an
    // attacker could send unlimited free key-guessing attempts with no
    // throttling. Bucketing an invalid key the same as no key (by IP, on the
    // public limiter) caps a brute-force attempt at the public budget before
    // it ever learns whether a guess was close.
    const keyCheck = checkAutomationApiKey(request);
    const limiter = keyCheck === "valid" ? rateLimiters.bookingsTrusted : rateLimiters.bookingsPublic;
    const rateLimitKey = keyCheck === "valid" ? getBearerToken(request)! : getClientIp(request);

    const result = limiter.check(rateLimitKey);
    if (!result.allowed) {
      throw appError("RATE_LIMITED", "Too many requests. Please try again shortly.", {
        "Retry-After": String(result.retryAfterSeconds),
      });
    }
    if (keyCheck === "invalid") {
      throw appError("UNAUTHORIZED", "Invalid API key.");
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw appError("INVALID_INPUT", "Request body must be valid JSON.");
    }

    const booking = await createBooking(body);
    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
