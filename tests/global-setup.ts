import "dotenv/config";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { Client } from "pg";
import { deriveTestDatabaseUrl } from "./test-database-url";

/**
 * Runs once before the whole test suite (a separate process from the test
 * workers): drops and recreates a dedicated Postgres test database, then
 * replays the real migrations against it — completely isolated from the dev
 * database. Each test file seeds/cleans its own fixtures within that shared
 * database.
 */
export default async function globalSetup() {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error("DATABASE_URL must be set (see .env.example) before running tests.");
  }
  const testUrl = deriveTestDatabaseUrl(baseUrl);
  const testDbName = new URL(testUrl).pathname.replace(/^\//, "");

  // You can't DROP/CREATE a database while connected to it — connect to the
  // server's default maintenance database instead.
  const maintenanceUrl = new URL(testUrl);
  maintenanceUrl.pathname = "/postgres";

  const admin = new Client({ connectionString: maintenanceUrl.toString() });
  await admin.connect();
  try {
    // Terminate any lingering connections from a previous run before dropping.
    await admin.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [testDbName]
    );
    await admin.query(`DROP DATABASE IF EXISTS "${testDbName}"`);
    await admin.query(`CREATE DATABASE "${testDbName}"`);
  } finally {
    await admin.end();
  }

  // shell:true is required on Windows to resolve npx.cmd; safe here since
  // every argument is a static literal, none of it is user input.
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: "inherit",
    shell: true,
  });
}
