import { DrizzleDB } from "../types";
import { categories } from "../db/schema";
import { eq } from "drizzle-orm";

export const getCategories = async (db: DrizzleDB) => {
  return await db.select().from(categories);
};

export const getCategoryById = async (db: DrizzleDB, id: number) => {
  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id));
  return result[0] || null;
};

export const createCategory = async (
  db: DrizzleDB,
  data: {
    languageId: number;
    name: string;
    slug: string;
    color?: string;
  }
) => {
  const result = await db.insert(categories).values(data).returning();
  return result[0];
};

export const updateCategory = async (
  db: DrizzleDB,
  id: number,
  data: {
    languageId?: number;
    name?: string;
    slug?: string;
    color?: string;
  }
) => {
  const result = await db
    .update(categories)
    .set(data)
    .where(eq(categories.id, id))
    .returning();
  return result[0] || null;
};

export const deleteCategory = async (db: DrizzleDB, id: number) => {
  const result = await db
    .delete(categories)
    .where(eq(categories.id, id))
    .returning();
  return result[0] || null;
};
