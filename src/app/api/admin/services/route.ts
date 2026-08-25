import { NextResponse, type NextRequest } from "next/server";
import { createService } from "@/lib/services";
import { requireAdminSession } from "@/lib/auth/admin-guard";
import { errorResponse } from "@/lib/http";
import { appError } from "@/lib/errors";

// Deliberately no AUTOMATION_API_KEY / rate-limit wiring here — this is an
// admin-only mutation endpoint, gated purely by the session cookie. See
// src/lib/auth/admin-guard.ts.
export async function POST(request: NextRequest) {
  try {
    requireAdminSession(request);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw appError("INVALID_INPUT", "Request body must be valid JSON.");
    }

    const service = await createService(body);
    return NextResponse.json({ service }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
