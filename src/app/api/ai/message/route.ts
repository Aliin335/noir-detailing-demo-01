import { NextResponse, type NextRequest } from "next/server";
import { getClientIp, rateLimiters } from "@/lib/rate-limit";
import { errorResponse } from "@/lib/http";
import { appError } from "@/lib/errors";

// PRODUCTION webhook.
const N8N_WEBHOOK_URL = "https://alliinn1.app.n8n.cloud/webhook/noie-ai-receptionist-v2";
const REQUEST_TIMEOUT_MS = 25_000;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_SESSION_ID_LENGTH = 200;

/**
 * n8n's "Respond to Webhook" node can return the AI Agent's reply under
 * several different shapes depending on how the workflow is wired (a plain
 * string, `{ output }`, `{ text }`, or an array of items wrapping any of
 * those). Rather than assuming one exact shape, this tries the common ones
 * in order and falls back to "" (treated as a failure by the caller) if
 * nothing recognizable is found.
 */
function extractReplyText(data: unknown): string {
  if (typeof data === "string") return data.trim();
  if (Array.isArray(data)) {
    for (const item of data) {
      const text = extractReplyText(item);
      if (text) return text;
    }
    return "";
  }
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    for (const key of ["output", "reply", "text", "message", "response", "answer"]) {
      const value = obj[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  return "";
}

// Bridges the public chat widget to the n8n AI receptionist workflow. Kept
// server-side (rather than the browser calling n8n directly) so the webhook
// URL is never exposed client-side and this endpoint can share the site's
// existing public rate-limiting. Not part of the AUTOMATION_API_KEY /
// trusted-tier system — that's for callers coming *into* our services/
// availability/bookings APIs (e.g. n8n itself), which is the opposite
// direction from this route.
export async function POST(request: NextRequest) {
  try {
    const result = rateLimiters.aiMessagePublic.check(getClientIp(request));
    if (!result.allowed) {
      throw appError("RATE_LIMITED", "Too many messages. Please slow down.", {
        "Retry-After": String(result.retryAfterSeconds),
      });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw appError("INVALID_INPUT", "Request body must be valid JSON.");
    }
    const { message, sessionId } = (body ?? {}) as Record<string, unknown>;

    if (typeof message !== "string" || !message.trim() || message.length > MAX_MESSAGE_LENGTH) {
      throw appError(
        "INVALID_INPUT",
        `"message" is required (1-${MAX_MESSAGE_LENGTH} characters).`
      );
    }
    if (
      typeof sessionId !== "string" ||
      !sessionId.trim() ||
      sessionId.length > MAX_SESSION_ID_LENGTH
    ) {
      throw appError("INVALID_INPUT", '"sessionId" is required.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let n8nRes: Response;
    try {
      n8nRes = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatInput: message.trim(), sessionId: sessionId.trim() }),
        signal: controller.signal,
      });
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      throw appError(
        "AI_SERVICE_UNAVAILABLE",
        isAbort
          ? "The AI receptionist took too long to respond. Please try again."
          : "Could not reach the AI receptionist right now. Please try again."
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!n8nRes.ok) {
      // Most common cause during testing: the n8n TEST webhook only
      // responds while the workflow is actively listening for a test
      // event in the n8n editor — otherwise n8n itself returns a 404.
      throw appError(
        "AI_SERVICE_UNAVAILABLE",
        "The AI receptionist isn't available right now. Please try again shortly."
      );
    }

    const data = await n8nRes.json().catch(() => null);
    const reply = extractReplyText(data);
    if (!reply) {
      console.error("[api/ai/message] unrecognized n8n response shape:", data);
      throw appError(
        "AI_SERVICE_UNAVAILABLE",
        "The AI receptionist gave an unexpected response. Please try again."
      );
    }

    return NextResponse.json({ reply });
  } catch (err) {
    return errorResponse(err);
  }
}
