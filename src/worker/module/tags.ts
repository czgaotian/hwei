import { DrizzleDB } from "../types";
import { tags } from "../db/schema";
import { eq } from "drizzle-orm";

export const getTags = async (db: DrizzleDB) => {
  return await db.select().from(tags);
};

export const getTagById = async (db: DrizzleDB, id: number) => {
  const result = await db.select().from(tags).where(eq(tags.id, id));
  return result[0] || null;
};

export const createTag = async (
  db: DrizzleDB,
  data: {
    languageId: number;
    name: string;
    color?: string;
  }
) => {
  const result = await db.insert(tags).values(data).returning();
  return result[0];
};

export const updateTag = async (
  db: DrizzleDB,
  id: number,
  data: {
    languageId?: number;
    name?: string;
    color?: string;
  }
) => {
  const result = await db
    .update(tags)
    .set(data)
    .where(eq(tags.id, id))
    .returning();
  return result[0] || null;
};

export const deleteTag = async (db: DrizzleDB, id: number) => {
  const result = await db.delete(tags).where(eq(tags.id, id)).returning();
  return result[0] || null;
};
