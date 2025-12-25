import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ----------------- categories -----------------
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  color: text("color"),
  createdAt: integer("created_at").default(sql`(strftime('%s','now'))`),
  updatedAt: integer("updated_at").default(sql`(strftime('%s','now'))`),
});

// ----------------- tags -----------------
export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  color: text("color"),
  createdAt: integer("created_at").default(sql`(strftime('%s','now'))`),
  updatedAt: integer("updated_at").default(sql`(strftime('%s','now'))`),
});

// ----------------- media -----------------
export const media = sqliteTable("media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  r2Key: text("r2_key").notNull().unique(),
  url: text("url").notNull(),
  mimeType: text("mime_type"),
  size: integer("size"),
  width: integer("width"),
  height: integer("height"),
  duration: integer("duration"),
  createdAt: integer("created_at").default(sql`(strftime('%s','now'))`),
});

// ----------------- posts -----------------
export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  coverMediaId: integer("cover_media_id").references(() => media.id),
  status: text("status").notNull().default("draft"),
  createdAt: integer("created_at").default(sql`(strftime('%s','now'))`),
  updatedAt: integer("updated_at").default(sql`(strftime('%s','now'))`),
});

// ----------------- post_tags -----------------
export const postTags = sqliteTable(
  "post_tags",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id),
  },
  (t) => [primaryKey({ columns: [t.postId, t.tagId] })]
);

// ----------------- post_media -----------------
export const postMedia = sqliteTable(
  "post_media",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id),
    mediaId: integer("media_id")
      .notNull()
      .references(() => media.id),
    purpose: text("purpose"),
  },
  (t) => [primaryKey({ columns: [t.postId, t.mediaId] })]
);
