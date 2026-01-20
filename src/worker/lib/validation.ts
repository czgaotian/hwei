import { z } from "@hono/zod-openapi";

// ----------------- Pagination -----------------
export const PaginationQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .default(1)
    .openapi({
      param: {
        name: "page",
        in: "query",
      },
      example: 1,
    }),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .default(10)
    .openapi({
      param: {
        name: "pageSize",
        in: "query",
      },
      example: 10,
    }),
  search: z
    .string()
    .optional()
    .openapi({
      param: {
        name: "search",
        in: "query",
      },
      example: "keyword",
    }),
});

// Articles list query with filters
export const ArticleListQuerySchema = PaginationQuerySchema.extend({
  status: z
    .enum(["draft", "published"])
    .optional()
    .openapi({
      param: {
        name: "status",
        in: "query",
      },
      example: "published",
    }),
  categoryId: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .openapi({
      param: {
        name: "categoryId",
        in: "query",
      },
      example: 1,
    }),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T,
) =>
  z.object({
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number().int().positive(),
      pageSize: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      totalPages: z.number().int().nonnegative(),
    }),
  });

// ----------------- User & Auth -----------------
export const signupParamsSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

// ----------------- Articles -----------------
export const ArticleSchema = z.object({
  id: z.number().int().openapi({ example: 1 }),
  title: z.string().openapi({ example: "My Blog Article" }),
  subtitle: z
    .string()
    .nullable()
    .openapi({ example: "An interesting subtitle" }),
  slug: z.string().openapi({ example: "my-blog-article" }),
  summary: z.string().nullable().openapi({ example: "A brief summary" }),
  content: z.string().openapi({ example: "Full article content here..." }),
  status: z
    .enum(["draft", "published"])
    .default("draft")
    .openapi({ example: "draft" }),
  pinned: z.boolean().default(false).openapi({ example: false }),
  categoryId: z.number().int().nullable().openapi({ example: 1 }),
  coverMediaId: z.number().int().nullable().openapi({ example: 1 }),
  createdAt: z.number().int().openapi({ example: 1735084800 }),
  updatedAt: z.number().int().openapi({ example: 1735084800 }),
  deletedAt: z.number().int().nullable().openapi({ example: null }),
});

export const CreateArticleSchema = z.object({
  title: z.string().min(1).max(255).openapi({ example: "My Blog Article" }),
  subtitle: z
    .string()
    .optional()
    .openapi({ example: "An interesting subtitle" }),
  slug: z.string().min(1).max(255).openapi({ example: "my-blog-article" }),
  summary: z.string().optional().openapi({ example: "A brief summary" }),
  content: z
    .string()
    .min(1)
    .openapi({ example: "Full article content here..." }),
  status: z
    .enum(["draft", "published"])
    .optional()
    .default("draft")
    .openapi({ example: "draft" }),
  pinned: z.boolean().optional().default(false).openapi({ example: false }),
  categoryId: z.number().int().optional().openapi({ example: 1 }),
  coverMediaId: z.number().int().optional().openapi({ example: 1 }),
});

export const UpdateArticleSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(255)
    .optional()
    .openapi({ example: "Updated Article" }),
  subtitle: z.string().optional().openapi({ example: "Updated subtitle" }),
  slug: z
    .string()
    .min(1)
    .max(255)
    .optional()
    .openapi({ example: "updated-article" }),
  summary: z.string().optional().openapi({ example: "Updated summary" }),
  content: z
    .string()
    .min(1)
    .optional()
    .openapi({ example: "Updated content..." }),
  status: z
    .enum(["draft", "published"])
    .optional()
    .openapi({ example: "published" }),
  pinned: z.boolean().optional().openapi({ example: true }),
  categoryId: z.number().int().optional().openapi({ example: 2 }),
  coverMediaId: z.number().int().optional().openapi({ example: 2 }),
});

export const ArticleIdParamSchema = z.object({
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
  name: z.string().openapi({ example: "Technology" }),
  color: z.string().nullable().openapi({ example: "#3B82F6" }),
  createdAt: z.number().int().openapi({ example: 1735084800 }),
  updatedAt: z.number().int().openapi({ example: 1735084800 }),
});

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(255).openapi({ example: "Technology" }),
  color: z.string().optional().openapi({ example: "#3B82F6" }),
});

export const UpdateCategorySchema = z.object({
  name: z
    .string()
    .min(1)
    .max(255)
    .optional()
    .openapi({ example: "Updated Technology" }),
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
  name: z.string().openapi({ example: "React" }),
  color: z.string().nullable().openapi({ example: "#10B981" }),
  createdAt: z.number().int().openapi({ example: 1735084800 }),
  updatedAt: z.number().int().openapi({ example: 1735084800 }),
});

export const CreateTagSchema = z.object({
  name: z.string().min(1).max(255).openapi({ example: "React" }),
  color: z.string().optional().openapi({ example: "#10B981" }),
});

export const UpdateTagSchema = z.object({
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

// ----------------- Media -----------------
export const MediaSchema = z.object({
  id: z.number().int().openapi({ example: 1 }),
  type: z.string().openapi({ example: "image" }),
  r2Key: z.string().openapi({ example: "uploads/image_123.jpg" }),
  url: z.string().openapi({ example: "https://cdn.example.com/image_123.jpg" }),
  filename: z.string().openapi({ example: "my-image.jpg" }),
  mimeType: z.string().nullable().openapi({ example: "image/jpeg" }),
  size: z.number().int().nullable().openapi({ example: 1024000 }),
  width: z.number().int().nullable().openapi({ example: 1920 }),
  height: z.number().int().nullable().openapi({ example: 1080 }),
  duration: z.number().int().nullable().openapi({ example: 120 }),
  createdAt: z.number().int().openapi({ example: 1735084800 }),
});

export const CreateMediaSchema = z.object({
  type: z.string().min(1).openapi({ example: "image" }),
  r2Key: z.string().min(1).openapi({ example: "uploads/image_123.jpg" }),
  url: z
    .string()
    .min(1)
    .openapi({ example: "https://cdn.example.com/image_123.jpg" }),
  filename: z.string().min(1).openapi({ example: "my-image.jpg" }),
  mimeType: z.string().optional().openapi({ example: "image/jpeg" }),
  size: z.number().int().optional().openapi({ example: 1024000 }),
  width: z.number().int().optional().openapi({ example: 1920 }),
  height: z.number().int().optional().openapi({ example: 1080 }),
  duration: z.number().int().optional().openapi({ example: 120 }),
});

export const MediaIdParamSchema = z.object({
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
