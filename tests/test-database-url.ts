/**
 * Derives a sibling "_test" database on the same Postgres server/credentials
 * as the given DATABASE_URL, so the test suite never touches the dev
 * database and never needs its own separately-configured connection string.
 */
export function deriveTestDatabaseUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  const dbName = url.pathname.replace(/^\//, "");
  if (!dbName) {
    throw new Error(`DATABASE_URL is missing a database name: ${databaseUrl}`);
  }
  url.pathname = `/${dbName}_test`;
  return url.toString();
}
