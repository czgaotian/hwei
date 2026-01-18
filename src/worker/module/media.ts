import { DrizzleDB } from "../types";
import { media, articleMedia } from "../db/schema";
import { eq, count } from "drizzle-orm";

export const getMediaList = async (db: DrizzleDB) => {
  return await db.select().from(media);
};

export const getMediaById = async (db: DrizzleDB, id: number) => {
  const result = await db.select().from(media).where(eq(media.id, id));
  return result[0] || null;
};

export const createMedia = async (
  db: DrizzleDB,
  data: {
    type: string;
    r2Key: string;
    url: string;
    filename: string;
    mimeType?: string;
    size?: number;
    width?: number;
    height?: number;
    duration?: number;
  },
) => {
  const result = await db.insert(media).values(data).returning();
  return result[0];
};

export const updateMedia = async (
  db: DrizzleDB,
  id: number,
  data: {
    type?: string;
    url?: string;
    filename?: string;
    mimeType?: string;
    size?: number;
    width?: number;
    height?: number;
    duration?: number;
  },
) => {
  const result = await db
    .update(media)
    .set(data)
    .where(eq(media.id, id))
    .returning();
  return result[0] || null;
};

export const deleteMedia = async (db: DrizzleDB, id: number) => {
  // 检查是否有文章使用此媒体文件
  const usageCount = await db
    .select({ count: count() })
    .from(articleMedia)
    .where(eq(articleMedia.mediaId, id));

  if (usageCount[0].count > 0) {
    throw new Error("Cannot delete media that is in use");
  }

  const result = await db.delete(media).where(eq(media.id, id)).returning();
  return result[0] || null;
};
