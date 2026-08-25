import { Prisma } from "@/generated/prisma/client";
import type { Service } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";
import { appError } from "@/lib/errors";
import { slugify } from "./slug";
import { parseCreateServiceInput, parseUpdateServiceInput, parseSetActiveInput } from "./validation";

/**
 * Creates a service. Always active on creation. The id is derived from the
 * name (see slug.ts) and never taken from client input — it becomes
 * permanent once created (see updateService below, which never touches it).
 */
export async function createService(rawInput: unknown): Promise<Service> {
  const input = parseCreateServiceInput(rawInput);
  const id = slugify(input.name);
  try {
    return await prisma.service.create({ data: { id, ...input, active: true } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw appError(
        "SERVICE_ID_CONFLICT",
        `A service derived from this name ("${id}") already exists. Choose a different name.`
      );
    }
    throw err;
  }
}

/**
 * Full-field edit of an existing service. Only ever updates name,
 * description, price, and durationMinutes — id and active are out of scope
 * for this function by construction (parseUpdateServiceInput never reads
 * them from the input).
 */
export async function updateService(id: string, rawInput: unknown): Promise<Service> {
  const input = parseUpdateServiceInput(rawInput);
  try {
    return await prisma.service.update({ where: { id }, data: input });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      throw appError("SERVICE_NOT_FOUND", `No service with id "${id}".`);
    }
    throw err;
  }
}

/** Activates or deactivates a service without touching any other field. */
export async function setServiceActive(id: string, rawInput: unknown): Promise<Service> {
  const active = parseSetActiveInput(rawInput);
  try {
    return await prisma.service.update({ where: { id }, data: { active } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      throw appError("SERVICE_NOT_FOUND", `No service with id "${id}".`);
    }
    throw err;
  }
}
