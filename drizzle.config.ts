import { defineConfig } from "drizzle-kit";
import * as fs from "fs";
import * as path from "path";

/**
 * Finds the D1 database for local development
 */
export function findSqliteDatabase() {
  const wranglerPath = path.join(
    ".wrangler",
    "state",
    "v3",
    "d1",
    "miniflare-D1DatabaseObject",
  );

  if (!fs.existsSync(wranglerPath)) return undefined;

  const files = fs.readdirSync(wranglerPath);
  const sqliteFile = files.find((file: string) => file.endsWith(".sqlite"));

  return sqliteFile ? { url: path.join(wranglerPath, sqliteFile) } : undefined;
}

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/worker/db/schema.ts",
  out: "./src/worker/db/migrations",
  dbCredentials: findSqliteDatabase(),
});
