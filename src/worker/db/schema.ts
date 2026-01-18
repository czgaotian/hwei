import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { PostStatus } from "../types/post";

// ----------------- categories -----------------
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  color: text("color"),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(strftime('%s','now'))`),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(strftime('%s','now'))`),
});

// ----------------- tags -----------------
export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  color: text("color"),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(strftime('%s','now'))`),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(strftime('%s','now'))`),
});

// ----------------- media -----------------
export const media = sqliteTable("media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  r2Key: text("r2_key").notNull().unique(),
  url: text("url").notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type"),
  size: integer("size"),
  width: integer("width"),
  height: integer("height"),
  duration: integer("duration"),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(strftime('%s','now'))`),
});

// ----------------- articles -----------------
export const articles = sqliteTable("articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  slug: text("slug").notNull().unique(),
  summary: text("summary"),
  content: text("content").notNull(),
  status: text("status", { enum: ["draft", "published"] })
    .$type<PostStatus>()
    .notNull()
    .default("draft"),
  pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
  categoryId: integer("category_id").references(() => categories.id),
  coverMediaId: integer("cover_media_id").references(() => media.id),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(strftime('%s','now'))`),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(strftime('%s','now'))`),
  deletedAt: integer("deleted_at"),
});

// ----------------- article_tags -----------------
export const articleTags = sqliteTable(
  "article_tags",
  {
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id),
  },
  (t) => [primaryKey({ columns: [t.articleId, t.tagId] })],
);

// ----------------- article_media -----------------
export const articleMedia = sqliteTable(
  "article_media",
  {
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id),
    mediaId: integer("media_id")
      .notNull()
      .references(() => media.id),
    purpose: text("purpose"),
  },
  (t) => [primaryKey({ columns: [t.articleId, t.mediaId] })],
);

// ----------------- users -----------------
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(strftime('%s','now'))`),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(strftime('%s','now'))`),
});
