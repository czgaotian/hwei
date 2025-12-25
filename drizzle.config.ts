import { defineConfig } from "drizzle-kit";
import { findSqliteDatabase } from "./scripts/findDB";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/worker/db/schema.ts",
  out: "./src/worker/db/migrations",
  dbCredentials: findSqliteDatabase(),
});
