import type { Config } from "drizzle-kit";

export default {
  dialect: "sqlite",
  schema: "./src/worker/db/schema.ts", // 指向你的 schema.sql
  out: "./drizzle", // 输出 TS schema
  driver: "d1-http",
} satisfies Config;
