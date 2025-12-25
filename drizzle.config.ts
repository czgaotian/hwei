import type { Config } from "drizzle-kit";

export default {
  dialect: "sqlite",
  schema: "./src/worker/db/schema.ts",
  out: "./src/worker/db/migrations",
} satisfies Config;
