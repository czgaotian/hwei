import { z } from "@hono/zod-openapi";

// ----------------- User & Auth -----------------
export const signupParamsSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

// ----------------- Posts -----------------
export const PostSchema = z.object({
  id: z.number().int().openapi({ example: 1 }),
  languageId: z.number().int().openapi({ example: 1 }),
  title: z.string().openapi({ example: "My Blog Post" }),
  description: z
    .string()
    .nullable()
    .openapi({ example: "A brief description" }),
  content: z.string().openapi({ example: "Full content here..." }),
  categoryId: z.number().int().openapi({ example: 1 }),
  coverMediaId: z.number().int().nullable().openapi({ example: 1 }),
  status: z
    .enum(["draft", "published", "archived"])
    .default("draft")
    .openapi({ example: "draft" }),
  createdAt: z.number().int().nullable().openapi({ example: 1735084800 }),
  updatedAt: z.number().int().nullable().openapi({ example: 1735084800 }),
});

export const CreatePostSchema = z.object({
  languageId: z.number().int().openapi({ example: 1 }),
  title: z.string().min(1).max(255).openapi({ example: "My Blog Post" }),
  description: z
    .string()
    .optional()
    .openapi({ example: "A brief description" }),
  content: z.string().min(1).openapi({ example: "Full content here..." }),
  categoryId: z.number().int().openapi({ example: 1 }),
  coverMediaId: z.number().int().optional().openapi({ example: 1 }),
  status: z
    .enum(["draft", "published", "archived"])
    .optional()
    .default("draft")
    .openapi({ example: "draft" }),
});

export const UpdatePostSchema = z.object({
  languageId: z.number().int().optional().openapi({ example: 1 }),
  title: z
    .string()
    .min(1)
    .max(255)
    .optional()
    .openapi({ example: "Updated Blog Post" }),
  description: z
    .string()
    .optional()
    .openapi({ example: "Updated description" }),
  content: z
    .string()
    .min(1)
    .optional()
    .openapi({ example: "Updated content..." }),
  categoryId: z.number().int().optional().openapi({ example: 1 }),
  coverMediaId: z.number().int().optional().openapi({ example: 1 }),
  status: z
    .enum(["draft", "published", "archived"])
    .optional()
    .openapi({ example: "published" }),
});

export const PostIdParamSchema = z.object({
  id: z.coerce
    .number()
    .int()
    .positive()
    .openapi({
      param: {
        name: "id",
        in: "path",
      },
      example: 1,
    }),
});

// ----------------- Categories -----------------
export const CategorySchema = z.object({
  id: z.number().int().openapi({ example: 1 }),
  languageId: z.number().int().openapi({ example: 1 }),
  name: z.string().openapi({ example: "Technology" }),
  slug: z.string().openapi({ example: "technology" }),
  color: z.string().nullable().openapi({ example: "#3B82F6" }),
  createdAt: z.number().int().nullable().openapi({ example: 1735084800 }),
  updatedAt: z.number().int().nullable().openapi({ example: 1735084800 }),
});

export const CreateCategorySchema = z.object({
  languageId: z.number().int().openapi({ example: 1 }),
  name: z.string().min(1).max(255).openapi({ example: "Technology" }),
  slug: z.string().min(1).max(255).openapi({ example: "technology" }),
  color: z.string().optional().openapi({ example: "#3B82F6" }),
});

export const UpdateCategorySchema = z.object({
  languageId: z.number().int().optional().openapi({ example: 1 }),
  name: z
    .string()
    .min(1)
    .max(255)
    .optional()
    .openapi({ example: "Updated Technology" }),
  slug: z
    .string()
    .min(1)
    .max(255)
    .optional()
    .openapi({ example: "updated-technology" }),
  color: z.string().optional().openapi({ example: "#EF4444" }),
});

export const CategoryIdParamSchema = z.object({
  id: z.coerce
    .number()
    .int()
    .positive()
    .openapi({
      param: {
        name: "id",
        in: "path",
      },
      example: 1,
    }),
});

// ----------------- Tags -----------------
export const TagSchema = z.object({
  id: z.number().int().openapi({ example: 1 }),
  languageId: z.number().int().openapi({ example: 1 }),
  name: z.string().openapi({ example: "React" }),
  color: z.string().nullable().openapi({ example: "#10B981" }),
  createdAt: z.number().int().nullable().openapi({ example: 1735084800 }),
  updatedAt: z.number().int().nullable().openapi({ example: 1735084800 }),
});

export const CreateTagSchema = z.object({
  languageId: z.number().int().openapi({ example: 1 }),
  name: z.string().min(1).max(255).openapi({ example: "React" }),
  color: z.string().optional().openapi({ example: "#10B981" }),
});

export const UpdateTagSchema = z.object({
  languageId: z.number().int().optional().openapi({ example: 1 }),
  name: z.string().min(1).max(255).optional().openapi({ example: "Vue.js" }),
  color: z.string().optional().openapi({ example: "#8B5CF6" }),
});

export const TagIdParamSchema = z.object({
  id: z.coerce
    .number()
    .int()
    .positive()
    .openapi({
      param: {
        name: "id",
        in: "path",
      },
      example: 1,
    }),
});

// ----------------- Languages -----------------
export const LanguageSchema = z.object({
  id: z.number().int().openapi({ example: 1 }),
  lang: z.string().openapi({ example: "zh-CN" }),
  locale: z.string().openapi({ example: "简体中文" }),
  isDefault: z.boolean().nullable().openapi({ example: false }),
});

export const CreateLanguageSchema = z.object({
  lang: z.string().min(1).max(50).openapi({ example: "zh-CN" }),
  locale: z.string().min(1).max(255).openapi({ example: "简体中文" }),
  isDefault: z.boolean().optional().openapi({ example: false }),
});

export const LanguageIdParamSchema = z.object({
  id: z.coerce
    .number()
    .int()
    .positive()
    .openapi({
      param: {
        name: "id",
        in: "path",
      },
      example: 1,
    }),
});
