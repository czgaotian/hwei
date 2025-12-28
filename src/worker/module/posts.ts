import { DrizzleDB } from "../types";
import { posts } from "../db/schema";
import { eq } from "drizzle-orm";
import { PostStatus } from "../types/post";

export const getPosts = async (db: DrizzleDB) => {
  return await db.select().from(posts);
};

export const getPostById = async (db: DrizzleDB, id: number) => {
  const result = await db.select().from(posts).where(eq(posts.id, id));
  return result[0] || null;
};

export const createPost = async (
  db: DrizzleDB,
  data: {
    languageId: number;
    title: string;
    description?: string;
    content: string;
    categoryId: number;
    coverMediaId?: number;
    status?: PostStatus;
  }
) => {
  const result = await db.insert(posts).values(data).returning();
  return result[0];
};

export const updatePost = async (
  db: DrizzleDB,
  id: number,
  data: {
    languageId?: number;
    title?: string;
    description?: string;
    content?: string;
    categoryId?: number;
    coverMediaId?: number;
    status?: PostStatus;
  }
) => {
  const result = await db
    .update(posts)
    .set(data)
    .where(eq(posts.id, id))
    .returning();
  return result[0] || null;
};

export const deletePost = async (db: DrizzleDB, id: number) => {
  const result = await db.delete(posts).where(eq(posts.id, id)).returning();
  return result[0] || null;
};
