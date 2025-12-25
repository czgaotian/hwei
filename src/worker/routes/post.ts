import * as userModule from "../module/posts";
import { getBlogDatabase } from "../lib/db";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { Context } from "../types";
import { json200Response, json401Response } from "../lib/openapi";
import { PostSchema } from "../lib/validation";

const app = new OpenAPIHono<Context>();

const getPosts = createRoute({
  method: "get",
  path: "/",
  responses: {
    ...json200Response(z.array(PostSchema), "List of blog posts"),
    ...json401Response,
  },
});

app.openapi(getPosts, async (c) => {
  const db = getBlogDatabase(c);
  const posts = await userModule.getPosts(db);
  return c.json(posts);
});

export default app;
