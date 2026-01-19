import { DrizzleDB } from "../types";
import { articles, articleTags, articleMedia, tags, media } from "../db/schema";
import { eq, isNull, and, desc, count } from "drizzle-orm";
import { PostStatus } from "../types/post";

export const getArticles = async (
  db: DrizzleDB,
  options?: { page?: number; pageSize?: number },
) => {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 10;
  const offset = (page - 1) * pageSize;

  const [data, totalResult] = await Promise.all([
    db
      .select({
        id: articles.id,
        title: articles.title,
        subtitle: articles.subtitle,
        slug: articles.slug,
        summary: articles.summary,
        content: articles.content,
        status: articles.status,
        pinned: articles.pinned,
        categoryId: articles.categoryId,
        coverMediaId: articles.coverMediaId,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        deletedAt: articles.deletedAt,
      })
      .from(articles)
      .where(isNull(articles.deletedAt))
      .orderBy(desc(articles.pinned), desc(articles.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: count() })
      .from(articles)
      .where(isNull(articles.deletedAt)),
  ]);

  return {
    data,
    total: totalResult[0].count,
  };
};

export const getArticleById = async (db: DrizzleDB, id: number) => {
  const result = await db
    .select()
    .from(articles)
    .where(and(eq(articles.id, id), isNull(articles.deletedAt)));
  return result[0] || null;
};

export const createArticle = async (
  db: DrizzleDB,
  data: {
    title: string;
    subtitle?: string;
    slug: string;
    summary?: string;
    content: string;
    status?: PostStatus;
    pinned?: boolean;
    categoryId?: number;
    coverMediaId?: number;
  },
) => {
  const result = await db
    .insert(articles)
    .values({
      ...data,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .returning();
  return result[0];
};

export const updateArticle = async (
  db: DrizzleDB,
  id: number,
  data: {
    title?: string;
    subtitle?: string;
    slug?: string;
    summary?: string;
    content?: string;
    status?: PostStatus;
    pinned?: boolean;
    categoryId?: number;
    coverMediaId?: number;
  },
) => {
  const result = await db
    .update(articles)
    .set({
      ...data,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(and(eq(articles.id, id), isNull(articles.deletedAt)))
    .returning();
  return result[0] || null;
};

export const deleteArticle = async (db: DrizzleDB, id: number) => {
  // 软删除
  const result = await db
    .update(articles)
    .set({ deletedAt: Math.floor(Date.now() / 1000) })
    .where(eq(articles.id, id))
    .returning();
  return result[0] || null;
};

// 获取文章的标签
export const getArticleTags = async (db: DrizzleDB, articleId: number) => {
  return await db
    .select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
    })
    .from(tags)
    .innerJoin(articleTags, eq(tags.id, articleTags.tagId))
    .where(eq(articleTags.articleId, articleId));
};

// 设置文章标签
export const setArticleTags = async (
  db: DrizzleDB,
  articleId: number,
  tagIds: number[],
) => {
  // 先删除现有关联
  await db.delete(articleTags).where(eq(articleTags.articleId, articleId));

  // 添加新关联
  if (tagIds.length > 0) {
    const insertData = tagIds.map((tagId) => ({ articleId, tagId }));
    await db.insert(articleTags).values(insertData);
  }
};

// 获取文章的媒体文件
export const getArticleMedia = async (db: DrizzleDB, articleId: number) => {
  return await db
    .select({
      id: media.id,
      type: media.type,
      url: media.url,
      filename: media.filename,
      purpose: articleMedia.purpose,
    })
    .from(media)
    .innerJoin(articleMedia, eq(media.id, articleMedia.mediaId))
    .where(eq(articleMedia.articleId, articleId));
};

// 添加文章媒体关联
export const addArticleMedia = async (
  db: DrizzleDB,
  articleId: number,
  mediaId: number,
  purpose?: string,
) => {
  const result = await db
    .insert(articleMedia)
    .values({
      articleId,
      mediaId,
      purpose,
    })
    .returning();
  return result[0];
};

// 移除文章媒体关联
export const removeArticleMedia = async (
  db: DrizzleDB,
  articleId: number,
  mediaId: number,
) => {
  const result = await db
    .delete(articleMedia)
    .where(
      and(
        eq(articleMedia.articleId, articleId),
        eq(articleMedia.mediaId, mediaId),
      ),
    )
    .returning();
  return result[0] || null;
};
