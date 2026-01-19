import { DrizzleDB } from "../types";
import { categories, articles } from "../db/schema";
import { eq, count, like } from "drizzle-orm";

export const getCategories = async (
  db: DrizzleDB,
  options?: { page?: number; pageSize?: number; search?: string },
) => {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 10;
  const offset = (page - 1) * pageSize;
  const search = options?.search;

  // 构建查询条件
  const whereCondition = search
    ? like(categories.name, `%${search}%`)
    : undefined;

  const [data, totalResult] = await Promise.all([
    db
      .select()
      .from(categories)
      .where(whereCondition)
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(categories).where(whereCondition),
  ]);

  return {
    data,
    total: totalResult[0].count,
  };
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
    name: string;
    color?: string;
  },
) => {
  const result = await db
    .insert(categories)
    .values({
      ...data,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .returning();
  return result[0];
};

export const updateCategory = async (
  db: DrizzleDB,
  id: number,
  data: {
    name?: string;
    color?: string;
  },
) => {
  const result = await db
    .update(categories)
    .set({
      ...data,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(categories.id, id))
    .returning();
  return result[0] || null;
};

export const deleteCategory = async (db: DrizzleDB, id: number) => {
  // 检查是否有文章使用此分类
  const articleCount = await db
    .select({ count: count() })
    .from(articles)
    .where(eq(articles.categoryId, id));

  if (articleCount[0].count > 0) {
    throw new Error("Cannot delete category that is in use");
  }

  const result = await db
    .delete(categories)
    .where(eq(categories.id, id))
    .returning();
  return result[0] || null;
};
