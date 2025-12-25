import { DrizzleD1Database } from "drizzle-orm/d1";
import { posts, tags } from "./db/schema";

export const getPosts = async (db: DrizzleD1Database) => {
  return await db.select().from(posts);
};

export const createTag = async (
  db: DrizzleD1Database,
  name: string,
  color: string
) => {
  console.log("Creating tag:", name);
  return await db.insert(tags).values({ name, color }).returning();
};
