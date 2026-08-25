import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as createServiceRoute } from "@/app/api/admin/services/route";
import { PATCH as editServiceRoute } from "@/app/api/admin/services/[id]/route";
import { PATCH as toggleServiceRoute } from "@/app/api/admin/services/[id]/active/route";
import { GET as getServices } from "@/app/api/services/route";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { clearNonSeedServices, seedTestServices } from "./helpers";

function adminCookie(): string {
  const { token } = createSessionToken("admin@example.com");
  return `${SESSION_COOKIE_NAME}=${token}`;
}

function adminRequest(opts: {
  method: string;
  url: string;
  cookie?: string;
  auth?: string;
  body?: unknown;
}): NextRequest {
  const headers = new Headers({ "content-type": "application/json" });
  if (opts.cookie) headers.set("cookie", opts.cookie);
  if (opts.auth) headers.set("authorization", opts.auth);
  return new NextRequest(opts.url, {
    method: opts.method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

function createRequest(opts: { cookie?: string; auth?: string; body?: unknown }) {
  return adminRequest({ method: "POST", url: "http://localhost/api/admin/services", ...opts });
}

function editRequest(id: string, opts: { cookie?: string; auth?: string; body?: unknown }) {
  return adminRequest({
    method: "PATCH",
    url: `http://localhost/api/admin/services/${id}`,
    ...opts,
  });
}

function toggleRequest(id: string, opts: { cookie?: string; auth?: string; body?: unknown }) {
  return adminRequest({
    method: "PATCH",
    url: `http://localhost/api/admin/services/${id}/active`,
    ...opts,
  });
}

async function activeServiceIds(): Promise<string[]> {
  const res = await getServices(new NextRequest("http://localhost/api/services"));
  const body = await res.json();
  return body.services.map((s: { id: string }) => s.id);
}

function validServiceBody(overrides: Record<string, unknown> = {}) {
  return {
    name: `Test Service ${Math.random().toString(36).slice(2, 8)}`,
    description: "A test service.",
    price: 100,
    durationMinutes: 60,
    ...overrides,
  };
}

describe("admin services API", () => {
  beforeAll(async () => {
    await seedTestServices();
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await clearNonSeedServices();
  });

  describe("POST /api/admin/services", () => {
    it("no cookie -> 401, nothing created", async () => {
      const body = validServiceBody();
      const res = await createServiceRoute(createRequest({ body }));
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("UNAUTHORIZED");

      const found = await prisma.service.findFirst({ where: { name: body.name as string } });
      expect(found).toBeNull();
    });

    it("corrupted cookie -> 401", async () => {
      const res = await createServiceRoute(
        createRequest({ cookie: `${SESSION_COOKIE_NAME}=garbage.notasignature`, body: validServiceBody() })
      );
      expect(res.status).toBe(401);
    });

    it("a valid AUTOMATION_API_KEY without a session cookie -> 401 (never grants write access)", async () => {
      vi.stubEnv("AUTOMATION_API_KEY", "some-key");
      const res = await createServiceRoute(
        createRequest({ auth: "Bearer some-key", body: validServiceBody() })
      );
      expect(res.status).toBe(401);
    });

    it("valid cookie + valid body -> 201, id derived from name, active by default, live in GET /api/services", async () => {
      const body = validServiceBody({ name: "Brand New Detail" });
      const res = await createServiceRoute(createRequest({ cookie: adminCookie(), body }));
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.service.id).toBe("brand-new-detail");
      expect(json.service.active).toBe(true);
      expect(json.service.name).toBe("Brand New Detail");

      expect(await activeServiceIds()).toContain("brand-new-detail");
    });

    it("name colliding with an existing service's derived id -> 409 SERVICE_ID_CONFLICT", async () => {
      const res = await createServiceRoute(
        createRequest({ cookie: adminCookie(), body: validServiceBody({ name: "Full Detail" }) })
      );
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error).toBe("SERVICE_ID_CONFLICT");
    });

    it("rejects invalid input", async () => {
      const cookie = adminCookie();
      const cases: Record<string, unknown>[] = [
        { ...validServiceBody(), name: "" },
        { ...validServiceBody(), name: undefined },
        { ...validServiceBody(), description: "" },
        { ...validServiceBody(), price: -1 },
        { ...validServiceBody(), price: "100" },
        { ...validServiceBody(), price: 1.5 },
        { ...validServiceBody(), durationMinutes: 0 },
        { ...validServiceBody(), durationMinutes: undefined },
      ];
      for (const body of cases) {
        const res = await createServiceRoute(createRequest({ cookie, body }));
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("INVALID_INPUT");
      }
    });
  });

  describe("PATCH /api/admin/services/[id]", () => {
    it("no cookie -> 401", async () => {
      const res = await editServiceRoute(editRequest("full-detail", { body: validServiceBody() }), {
        params: Promise.resolve({ id: "full-detail" }),
      });
      expect(res.status).toBe(401);
    });

    it("nonexistent id, valid cookie -> 404 SERVICE_NOT_FOUND", async () => {
      const res = await editServiceRoute(
        editRequest("does-not-exist", { cookie: adminCookie(), body: validServiceBody() }),
        { params: Promise.resolve({ id: "does-not-exist" }) }
      );
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("SERVICE_NOT_FOUND");
    });

    it("valid cookie + valid body -> 200, updated fields reflected live in GET /api/services", async () => {
      const created = await createServiceRoute(
        createRequest({ cookie: adminCookie(), body: validServiceBody({ name: "Editable Detail" }) })
      );
      const { service } = await created.json();

      const res = await editServiceRoute(
        editRequest(service.id, {
          cookie: adminCookie(),
          body: validServiceBody({ name: "Editable Detail", price: 999, description: "Updated." }),
        }),
        { params: Promise.resolve({ id: service.id }) }
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.service.price).toBe(999);
      expect(json.service.description).toBe("Updated.");
      expect(json.service.id).toBe(service.id); // id never changes on edit

      const listRes = await getServices(new NextRequest("http://localhost/api/services"));
      const list = await listRes.json();
      const updated = list.services.find((s: { id: string }) => s.id === service.id);
      expect(updated.price).toBe(999);
    });

    it("rejects invalid input on edit", async () => {
      const created = await createServiceRoute(
        createRequest({ cookie: adminCookie(), body: validServiceBody({ name: "Invalid Edit Target" }) })
      );
      const { service } = await created.json();

      const res = await editServiceRoute(
        editRequest(service.id, { cookie: adminCookie(), body: { ...validServiceBody(), durationMinutes: -5 } }),
        { params: Promise.resolve({ id: service.id }) }
      );
      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/admin/services/[id]/active", () => {
    it("no cookie -> 401", async () => {
      const res = await toggleServiceRoute(toggleRequest("full-detail", { body: { active: false } }), {
        params: Promise.resolve({ id: "full-detail" }),
      });
      expect(res.status).toBe(401);
    });

    it("deactivating removes it from GET /api/services; reactivating brings it back", async () => {
      const created = await createServiceRoute(
        createRequest({ cookie: adminCookie(), body: validServiceBody({ name: "Togglable Detail" }) })
      );
      const { service } = await created.json();
      expect(await activeServiceIds()).toContain(service.id);

      const off = await toggleServiceRoute(
        toggleRequest(service.id, { cookie: adminCookie(), body: { active: false } }),
        { params: Promise.resolve({ id: service.id }) }
      );
      expect(off.status).toBe(200);
      expect(await activeServiceIds()).not.toContain(service.id);

      const on = await toggleServiceRoute(
        toggleRequest(service.id, { cookie: adminCookie(), body: { active: true } }),
        { params: Promise.resolve({ id: service.id }) }
      );
      expect(on.status).toBe(200);
      expect(await activeServiceIds()).toContain(service.id);
    });

    it("wrong-typed active -> 400 INVALID_INPUT", async () => {
      const created = await createServiceRoute(
        createRequest({ cookie: adminCookie(), body: validServiceBody({ name: "Bad Toggle Target" }) })
      );
      const { service } = await created.json();

      const res = await toggleServiceRoute(
        toggleRequest(service.id, { cookie: adminCookie(), body: { active: "yes" } }),
        { params: Promise.resolve({ id: service.id }) }
      );
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("INVALID_INPUT");
    });

    it("nonexistent id, valid cookie -> 404 SERVICE_NOT_FOUND", async () => {
      const res = await toggleServiceRoute(
        toggleRequest("does-not-exist", { cookie: adminCookie(), body: { active: false } }),
        { params: Promise.resolve({ id: "does-not-exist" }) }
      );
      expect(res.status).toBe(404);
    });
  });
});
