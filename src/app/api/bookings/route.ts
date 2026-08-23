import { NextResponse, type NextRequest } from "next/server";
import { createBooking } from "@/lib/bookings";
import { errorResponse } from "@/lib/http";
import { appError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
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
