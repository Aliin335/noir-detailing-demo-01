import { prisma } from "@/lib/db/client";

export async function seedTestServices() {
  await prisma.service.upsert({
    where: { id: "essential-detail" },
    update: {
      name: "Essential Detail",
      description: "test",
      price: 90,
      durationMinutes: 120,
      active: true,
    },
    create: {
      id: "essential-detail",
      name: "Essential Detail",
      description: "test",
      price: 90,
      durationMinutes: 120,
      active: true,
    },
  });

  await prisma.service.upsert({
    where: { id: "full-detail" },
    update: {
      name: "Full Detail",
      description: "test",
      price: 180,
      durationMinutes: 180,
      active: true,
    },
    create: {
      id: "full-detail",
      name: "Full Detail",
      description: "test",
      price: 180,
      durationMinutes: 180,
      active: true,
    },
  });

  await prisma.service.upsert({
    where: { id: "inactive-service" },
    update: {
      name: "Retired Service",
      description: "test",
      price: 50,
      durationMinutes: 60,
      active: false,
    },
    create: {
      id: "inactive-service",
      name: "Retired Service",
      description: "test",
      price: 50,
      durationMinutes: 60,
      active: false,
    },
  });
}

export async function clearBookings() {
  await prisma.booking.deleteMany();
}

const SEED_SERVICE_IDS = ["essential-detail", "full-detail", "inactive-service"];

/** Removes any service created by a test (e.g. via createService) without
 * touching the canonical seeded fixtures other test files rely on. */
export async function clearNonSeedServices() {
  await prisma.service.deleteMany({ where: { id: { notIn: SEED_SERVICE_IDS } } });
}

export function validBookingInput(overrides: Record<string, unknown> = {}) {
  return {
    customerName: "Test Customer",
    phone: "+353 87 000 0000",
    email: "test@example.com",
    vehicleDescription: "Test vehicle",
    serviceId: "full-detail",
    date: "2026-08-20",
    startTime: "10:00",
    ...overrides,
  };
}
