import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { checkAutomationApiKey, getBearerToken } from "@/lib/auth/service-auth";

function requestWithAuthHeader(value: string | null): NextRequest {
  const headers = new Headers();
  if (value !== null) headers.set("authorization", value);
  return new NextRequest("http://localhost/api/test", { headers });
}

describe("checkAutomationApiKey", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 'absent' when no Authorization header is present", () => {
    vi.stubEnv("AUTOMATION_API_KEY", "secret-key");
    expect(checkAutomationApiKey(requestWithAuthHeader(null))).toBe("absent");
  });

  it("returns 'invalid' when a key is presented but AUTOMATION_API_KEY is unset", () => {
    vi.stubEnv("AUTOMATION_API_KEY", "");
    expect(checkAutomationApiKey(requestWithAuthHeader("Bearer anything"))).toBe("invalid");
  });

  it("returns 'invalid' when the presented key doesn't match", () => {
    vi.stubEnv("AUTOMATION_API_KEY", "secret-key");
    expect(checkAutomationApiKey(requestWithAuthHeader("Bearer wrong-key"))).toBe("invalid");
  });

  it("returns 'valid' when the presented key matches exactly", () => {
    vi.stubEnv("AUTOMATION_API_KEY", "secret-key");
    expect(checkAutomationApiKey(requestWithAuthHeader("Bearer secret-key"))).toBe("valid");
  });

  it("treats a malformed Authorization header as 'absent'", () => {
    vi.stubEnv("AUTOMATION_API_KEY", "secret-key");
    expect(checkAutomationApiKey(requestWithAuthHeader("Basic secret-key"))).toBe("absent");
    expect(checkAutomationApiKey(requestWithAuthHeader("Bearer"))).toBe("absent");
  });
});

describe("getBearerToken", () => {
  it("returns null when no header is present", () => {
    expect(getBearerToken(requestWithAuthHeader(null))).toBeNull();
  });

  it("is case-insensitive on the Bearer scheme and trims the token", () => {
    expect(getBearerToken(requestWithAuthHeader("bearer   my-token  "))).toBe("my-token");
    expect(getBearerToken(requestWithAuthHeader("BEARER my-token"))).toBe("my-token");
  });

  it("returns null for a non-Bearer scheme", () => {
    expect(getBearerToken(requestWithAuthHeader("Basic dXNlcjpwYXNz"))).toBeNull();
  });
});
