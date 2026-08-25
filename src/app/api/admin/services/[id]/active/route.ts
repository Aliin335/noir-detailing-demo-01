import { NextResponse, type NextRequest } from "next/server";
import { setServiceActive } from "@/lib/services";
import { requireAdminSession } from "@/lib/auth/admin-guard";
import { errorResponse } from "@/lib/http";
import { appError } from "@/lib/errors";

// Deliberately no AUTOMATION_API_KEY / rate-limit wiring here — this is an
// admin-only mutation endpoint, gated purely by the session cookie. See
// src/lib/auth/admin-guard.ts.
//
// Kept separate from PATCH /api/admin/services/[id] so the activate/
// deactivate toggle only ever sends { active }, never a possibly-stale
// copy of the other fields.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdminSession(request);
    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw appError("INVALID_INPUT", "Request body must be valid JSON.");
    }

    const service = await setServiceActive(id, body);
    return NextResponse.json({ service });
  } catch (err) {
    return errorResponse(err);
  }
}
