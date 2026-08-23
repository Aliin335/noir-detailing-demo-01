import { NextResponse, type NextRequest } from "next/server";
import { getAvailableSlots } from "@/lib/availability";
import { errorResponse } from "@/lib/http";
import { appError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get("date");
    const serviceId = request.nextUrl.searchParams.get("serviceId");

    if (!date || !serviceId) {
      throw appError("INVALID_INPUT", "Both \"date\" and \"serviceId\" query parameters are required.");
    }

    const slots = await getAvailableSlots(date, serviceId);
    return NextResponse.json({ date, serviceId, slots });
  } catch (err) {
    return errorResponse(err);
  }
}
