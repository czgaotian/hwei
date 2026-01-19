import * as articleModule from "../module/articles";
import { getBlogDatabase } from "../lib/db";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { Context } from "../types";
import { requestBody } from "../lib/openapi";
import {
  ArticleSchema,
  CreateArticleSchema,
  UpdateArticleSchema,
  ArticleIdParamSchema,
  PaginationQuerySchema,
  PaginatedResponseSchema,
} from "../lib/validation";

const app = new OpenAPIHono<Context>();

// GET /articles - 获取所有文章列表
const getArticles = createRoute({
  method: "get",
  path: "/",
  request: {
    query: PaginationQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PaginatedResponseSchema(ArticleSchema),
        },
      },
      description: "Paginated list of blog articles",
    },
  },
});

app.openapi(getArticles, async (c) => {
  const db = getBlogDatabase(c);
  const { page, pageSize } = c.req.valid("query");

  const { data, total } = await articleModule.getArticles(db, {
    page,
    pageSize,
  });

  return c.json(
    {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    },
    200,
  );
});

// GET /articles/:id - 获取单个文章
const getArticle = createRoute({
  method: "get",
  path: "/{id}",
  request: {
    params: ArticleIdParamSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ArticleSchema,
        },
      },
      description: "Article details",
    },
    404: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Article not found",
    },
  },
});

app.openapi(getArticle, async (c) => {
  const db = getBlogDatabase(c);
  const { id } = c.req.valid("param");

  const article = await articleModule.getArticleById(db, id);

  if (!article) {
    return c.text("Article not found", 404);
  }

  return c.json(article, 200);
});

// POST /articles - 创建新文章
const createArticle = createRoute({
  method: "post",
  path: "/",
  ...requestBody(CreateArticleSchema),
  responses: {
    201: {
      content: {
        "application/json": {
          schema: ArticleSchema,
        },
      },
      description: "Article created successfully",
    },
    400: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Invalid request data",
    },
  },
});

app.openapi(createArticle, async (c) => {
  const db = getBlogDatabase(c);
  const data = c.req.valid("json");

  try {
    const newArticle = await articleModule.createArticle(db, data);
    return c.json(newArticle, 201);
  } catch (error) {
    return c.text(`Failed to create article: ${error}`, 400);
  }
});

// PUT /articles/:id - 更新文章
const updateArticle = createRoute({
  method: "put",
  path: "/{id}",
  request: {
    params: ArticleIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateArticleSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ArticleSchema,
        },
      },
      description: "Article updated successfully",
    },
    404: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Article not found",
    },
    400: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Invalid request data",
    },
  },
});

app.openapi(updateArticle, async (c) => {
  const db = getBlogDatabase(c);
  const { id } = c.req.valid("param");
  const data = c.req.valid("json");

  try {
    const updatedArticle = await articleModule.updateArticle(db, id, data);

    if (!updatedArticle) {
      return c.text("Article not found", 404);
    }

    return c.json(updatedArticle, 200);
  } catch (error) {
    return c.text(`Failed to update article: ${error}`, 400);
  }
});

// DELETE /articles/:id - 删除文章（软删除）
const deleteArticle = createRoute({
  method: "delete",
  path: "/{id}",
  request: {
    params: ArticleIdParamSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ArticleSchema,
        },
      },
      description: "Article deleted successfully",
    },
    404: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Article not found",
    },
  },
});

app.openapi(deleteArticle, async (c) => {
  const db = getBlogDatabase(c);
  const { id } = c.req.valid("param");

  const deletedArticle = await articleModule.deleteArticle(db, id);

  if (!deletedArticle) {
    return c.text("Article not found", 404);
  }

  return c.json(deletedArticle, 200);
});

// GET /articles/:id/tags - 获取文章标签
const getArticleTags = createRoute({
  method: "get",
  path: "/{id}/tags",
  request: {
    params: ArticleIdParamSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(
            z.object({
              id: z.number(),
              name: z.string(),
              color: z.string().nullable(),
            }),
          ),
        },
      },
      description: "Article tags",
    },
    404: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Article not found",
    },
  },
});

app.openapi(getArticleTags, async (c) => {
  const db = getBlogDatabase(c);
  const { id } = c.req.valid("param");

  // 检查文章是否存在
  const article = await articleModule.getArticleById(db, id);
  if (!article) {
    return c.text("Article not found", 404);
  }

  const tags = await articleModule.getArticleTags(db, id);
  return c.json(tags, 200);
});

// PUT /articles/:id/tags - 设置文章标签
const setArticleTags = createRoute({
  method: "put",
  path: "/{id}/tags",
  request: {
    params: ArticleIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: z.object({
            tagIds: z.array(z.number().int().positive()),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Tags updated successfully",
    },
    404: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Article not found",
    },
    400: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Failed to update tags",
    },
  },
});

app.openapi(setArticleTags, async (c) => {
  const db = getBlogDatabase(c);
  const { id } = c.req.valid("param");
  const { tagIds } = c.req.valid("json");

  // 检查文章是否存在
  const article = await articleModule.getArticleById(db, id);
  if (!article) {
    return c.text("Article not found", 404);
  }

  try {
    await articleModule.setArticleTags(db, id, tagIds);
    return c.text("Tags updated successfully", 200);
  } catch (error) {
    return c.text(`Failed to update tags: ${error}`, 400);
  }
});

export default app;
