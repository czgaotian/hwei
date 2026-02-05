import { DrizzleDB } from "../types";
import { articles, articleTags, articleMedia, tags, media, categories } from "../db/schema";
import { eq, isNull, and, desc, count, like, or, SQL, inArray } from "drizzle-orm";
import { PostStatus } from "../types/post";

export const getArticles = async (
  db: DrizzleDB,
  options?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: PostStatus;
    categoryId?: number;
  },
) => {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 10;
  const offset = (page - 1) * pageSize;
  const search = options?.search;
  const status = options?.status;
  const categoryId = options?.categoryId;

  // 构建搜索条件 - 搜索title, subtitle, content
  const searchCondition = search
    ? or(
        like(articles.title, `%${search}%`),
        like(articles.subtitle, `%${search}%`),
        like(articles.content, `%${search}%`),
      )
    : undefined;

  // 其他过滤条件
  const statusCondition = status ? eq(articles.status, status) : undefined;
  const categoryCondition =
    typeof categoryId === "number"
      ? eq(articles.categoryId, categoryId)
      : undefined;

  // 组合条件
  const conditions = [
    isNull(articles.deletedAt),
    searchCondition,
    statusCondition,
    categoryCondition,
  ].filter((condition): condition is SQL<unknown> => condition !== undefined);

  const whereCondition =
    conditions.length > 1 ? and(...conditions) : conditions[0];

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
        // Include category data via LEFT JOIN
        category: {
          id: categories.id,
          name: categories.name,
          color: categories.color,
        },
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(whereCondition)
      .orderBy(desc(articles.pinned), desc(articles.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(articles).where(whereCondition),
  ]);

  // Batch fetch tags for all articles
  const articleIds = data.map((article) => article.id);
  
  let articleTagsMap: Record<number, Array<{ id: number; name: string; color: string | null }>> = {};
  
  if (articleIds.length > 0) {
    const allTags = await db
      .select({
        articleId: articleTags.articleId,
        id: tags.id,
        name: tags.name,
        color: tags.color,
      })
      .from(articleTags)
      .innerJoin(tags, eq(articleTags.tagId, tags.id))
      .where(inArray(articleTags.articleId, articleIds));

    // Group tags by article ID
    articleTagsMap = allTags.reduce((acc, tag) => {
      if (!acc[tag.articleId]) {
        acc[tag.articleId] = [];
      }
      acc[tag.articleId].push({
        id: tag.id,
        name: tag.name,
        color: tag.color,
      });
      return acc;
    }, {} as Record<number, Array<{ id: number; name: string; color: string | null }>>);
  }

  // Transform data to include tags
  const transformedData = data.map((article) => ({
    id: article.id,
    title: article.title,
    subtitle: article.subtitle,
    slug: article.slug,
    summary: article.summary,
    content: article.content,
    status: article.status,
    pinned: article.pinned,
    categoryId: article.categoryId,
    coverMediaId: article.coverMediaId,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    deletedAt: article.deletedAt,
    category: article.category,
    tags: articleTagsMap[article.id] || [],
  }));

  return {
    data: transformedData,
    total: totalResult[0].count,
  };
};

export const getArticleById = async (db: DrizzleDB, id: number) => {
  const result = await db
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
      category: {
        id: categories.id,
        name: categories.name,
        color: categories.color,
      },
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(and(eq(articles.id, id), isNull(articles.deletedAt)));
  
  if (!result[0]) {
    return null;
  }

  // Fetch tags for this article
  const articleTags = await getArticleTags(db, id);

  return {
    ...result[0],
    tags: articleTags,
  };
};

export const createArticle = async (
  db: DrizzleDB,
  data: {
    title: string;
    subtitle?: string;
    slug?: string;
    summary?: string;
    content: string;
    status?: PostStatus;
    pinned?: boolean;
    categoryId?: number;
    coverMediaId?: number;
  },
) => {
  // Auto-generate slug from title if not provided
  const slug = data.slug || data.title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-\u4e00-\u9fa5]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^\-+/, '')
    .replace(/\-+$/, '');

  const result = await db
    .insert(articles)
    .values({
      ...data,
      slug,
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
