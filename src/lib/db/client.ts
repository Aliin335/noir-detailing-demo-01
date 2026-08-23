import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma 7 moved the connection string out of schema.prisma and into a
 * runtime "driver adapter" passed to the PrismaClient constructor. Postgres
 * (Render Postgres in production, a local instance in dev) is reached
 * through `DATABASE_URL`, the same variable and the same adapter model in
 * both environments — no separate SQLite-vs-Postgres code path.
 */
function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const adapter = new PrismaPg(url);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Reuse a single client (and its underlying pg connection pool) across
// Next.js dev-server hot reloads, otherwise each reload opens a new pool
// and eventually exhausts the database's max connection limit.
export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
