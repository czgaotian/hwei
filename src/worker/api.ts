import { Hono } from "hono";
import { cors } from "hono/cors";
import { drizzle } from "drizzle-orm/d1";
import * as models from "./models";

const api = new Hono<{ Bindings: Env }>();
api.use("/posts/*", cors());

api.get("/", (c) => {
  return c.json({ message: "Hello" });
});

api.get("/posts", async (c) => {
  const db = drizzle(c.env.BLOG_DATABASE);
  const posts = await models.getPosts(db);
  return c.json({ posts: posts, ok: true });
});

api.post("/tags", async (c) => {
  const { name, color } = await c.req.json();
  const db = drizzle(c.env.BLOG_DATABASE);
  await models.createTag(db, name, color);
  return c.json({ ok: true });
});

export default api;
