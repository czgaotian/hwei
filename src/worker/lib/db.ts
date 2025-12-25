import { drizzle } from "drizzle-orm/d1";
import { Context as HonoContext } from "hono";
import { Context } from "../types";
import * as schema from "../db/schema";

export const getBlogDatabase = (context: HonoContext<Context>) => {
  return drizzle<typeof schema>(context.env.BLOG_DATABASE, { schema });
};
