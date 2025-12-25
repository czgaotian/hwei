import { z } from "@hono/zod-openapi";

// ----------------- User & Auth -----------------
export const signupParamsSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});
