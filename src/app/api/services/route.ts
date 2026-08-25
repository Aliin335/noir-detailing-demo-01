import { NextResponse, type NextRequest } from "next/server";
import { getActiveServices } from "@/lib/services";
import { checkAutomationApiKey, getBearerToken } from "@/lib/auth/service-auth";
import { getClientIp, rateLimiters } from "@/lib/rate-limit";
import { errorResponse } from "@/lib/http";
import { appError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    // Rate limit before checking key validity — see src/app/api/bookings/route.ts
    // for the identical rationale (caps key brute-forcing at the public budget).
    const keyCheck = checkAutomationApiKey(request);
    const limiter = keyCheck === "valid" ? rateLimiters.servicesTrusted : rateLimiters.servicesPublic;
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

    const services = await getActiveServices();
    return NextResponse.json({
      services: services.map((service) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        price: service.price,
        durationMinutes: service.durationMinutes,
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
