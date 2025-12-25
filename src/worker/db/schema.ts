import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ----------------- languages -----------------
export const languages = sqliteTable("languages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  lang: text("lang").notNull().unique(), // e.g. "zh-CN", "en"
  locale: text("locale").notNull().unique(), // e.g. human readable name
  isDefault: integer("is_default", { mode: "boolean" }).default(false),
});

// ----------------- categories -----------------
export const categories = sqliteTable(
  "categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    languageId: integer("language_id")
      .notNull()
      .references(() => languages.id),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    color: text("color"),
    createdAt: integer("created_at").default(sql`(strftime('%s','now'))`),
    updatedAt: integer("updated_at").default(sql`(strftime('%s','now'))`),
  },
  (t) => [
    uniqueIndex("categories_slug_language_unique").on(t.languageId, t.slug),
    uniqueIndex("categories_name_language_unique").on(t.languageId, t.name),
  ]
);

// ----------------- tags -----------------
export const tags = sqliteTable(
  "tags",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    languageId: integer("language_id")
      .notNull()
      .references(() => languages.id),
    name: text("name").notNull(),
    color: text("color"),
    createdAt: integer("created_at").default(sql`(strftime('%s','now'))`),
    updatedAt: integer("updated_at").default(sql`(strftime('%s','now'))`),
  },
  (t) => [uniqueIndex("tags_name_language_unique").on(t.languageId, t.name)]
);

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
  languageId: integer("language_id")
    .notNull()
    .references(() => languages.id),
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

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  password: text("password").notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expires_at: integer("expires_at").notNull(),
  user_id: integer("user_id")
    .notNull()
    .references(() => user.id),
  fresh: integer("fresh", { mode: "boolean" }),
});
