import "dotenv/config";
import path from "node:path";
import { defineConfig } from "vitest/config";
import { deriveTestDatabaseUrl } from "./tests/test-database-url";

const rootDir = import.meta.dirname;

const baseUrl = process.env.DATABASE_URL;
if (!baseUrl) {
  throw new Error("DATABASE_URL must be set (see .env.example) before running tests.");
}
const TEST_DATABASE_URL = deriveTestDatabaseUrl(baseUrl);

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
  test: {
    environment: "node",
    globalSetup: ["./tests/global-setup.ts"],
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
    },
    fileParallelism: false,
  },
});
