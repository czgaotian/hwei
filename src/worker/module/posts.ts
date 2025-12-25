import { DrizzleDB } from "../types";
import { posts, tags } from "../db/schema";

export const getPosts = async (db: DrizzleDB) => {
  return await db.select().from(posts);
};

export const createTag = async (db: DrizzleDB, name: string, color: string) => {
  return await db.insert(tags).values({ name, color }).returning();
};
