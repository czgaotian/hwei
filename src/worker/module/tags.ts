import { DrizzleDB } from "../types";
import { tags, articleTags } from "../db/schema";
import { eq, count } from "drizzle-orm";

export const getTags = async (
  db: DrizzleDB,
  options?: { page?: number; pageSize?: number },
) => {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 10;
  const offset = (page - 1) * pageSize;

  const [data, totalResult] = await Promise.all([
    db.select().from(tags).limit(pageSize).offset(offset),
    db.select({ count: count() }).from(tags),
  ]);

  return {
    data,
    total: totalResult[0].count,
  };
};

export const getTagById = async (db: DrizzleDB, id: number) => {
  const result = await db.select().from(tags).where(eq(tags.id, id));
  return result[0] || null;
};

export const createTag = async (
  db: DrizzleDB,
  data: {
    name: string;
    color?: string;
  },
) => {
  const result = await db
    .insert(tags)
    .values({
      ...data,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .returning();
  return result[0];
};

export const updateTag = async (
  db: DrizzleDB,
  id: number,
  data: {
    name?: string;
    color?: string;
  },
) => {
  const result = await db
    .update(tags)
    .set({
      ...data,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(tags.id, id))
    .returning();
  return result[0] || null;
};

export const deleteTag = async (db: DrizzleDB, id: number) => {
  // 先删除关联的文章标签
  await db.delete(articleTags).where(eq(articleTags.tagId, id));

  // 删除标签
  const result = await db.delete(tags).where(eq(tags.id, id)).returning();
  return result[0] || null;
};
