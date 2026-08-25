import { prisma } from "@/lib/db/client";
import type { Service } from "@/generated/prisma/client";

export type { Service };

export function getActiveServices(): Promise<Service[]> {
  return prisma.service.findMany({ where: { active: true } });
}

/** All services regardless of active status — for admin/ops views only. */
export function getAllServices(): Promise<Service[]> {
  return prisma.service.findMany({ orderBy: { price: "asc" } });
}

/** Returns the service only if it exists AND is active — inactive services are treated as not found. */
export async function getActiveServiceById(id: string): Promise<Service | null> {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service || !service.active) return null;
  return service;
}

export { createService, updateService, setServiceActive } from "./mutations";
export {
  parseCreateServiceInput,
  parseUpdateServiceInput,
  parseSetActiveInput,
  type CreateServiceInput,
  type UpdateServiceInput,
} from "./validation";
export { slugify } from "./slug";
