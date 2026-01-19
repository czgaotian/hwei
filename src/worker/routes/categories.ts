import * as categoryModule from "../module/categories";
import { getBlogDatabase } from "../lib/db";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { Context } from "../types";
import { requestBody } from "../lib/openapi";
import {
  CategorySchema,
  CreateCategorySchema,
  UpdateCategorySchema,
  CategoryIdParamSchema,
  PaginationQuerySchema,
  PaginatedResponseSchema,
} from "../lib/validation";

const app = new OpenAPIHono<Context>();

// GET /categories - 获取所有分类列表
const getCategories = createRoute({
  method: "get",
  path: "/",
  request: {
    query: PaginationQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PaginatedResponseSchema(CategorySchema),
        },
      },
      description: "Paginated list of categories",
    },
  },
});

app.openapi(getCategories, async (c) => {
  const db = getBlogDatabase(c);
  const { page, pageSize } = c.req.valid("query");

  const { data, total } = await categoryModule.getCategories(db, {
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

// GET /categories/:id - 获取单个分类
const getCategory = createRoute({
  method: "get",
  path: "/{id}",
  request: {
    params: CategoryIdParamSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: CategorySchema,
        },
      },
      description: "Category details",
    },
    404: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Category not found",
    },
  },
});

app.openapi(getCategory, async (c) => {
  const db = getBlogDatabase(c);
  const { id } = c.req.valid("param");

  const category = await categoryModule.getCategoryById(db, id);

  if (!category) {
    return c.text("Category not found", 404);
  }

  return c.json(category, 200);
});

// POST /categories - 创建新分类
const createCategory = createRoute({
  method: "post",
  path: "/",
  ...requestBody(CreateCategorySchema),
  responses: {
    201: {
      content: {
        "application/json": {
          schema: CategorySchema,
        },
      },
      description: "Category created successfully",
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

app.openapi(createCategory, async (c) => {
  const db = getBlogDatabase(c);
  const data = c.req.valid("json");

  try {
    const newCategory = await categoryModule.createCategory(db, data);
    return c.json(newCategory, 201);
  } catch (error) {
    return c.text(`Failed to create category: ${error}`, 400);
  }
});

// PUT /categories/:id - 更新分类
const updateCategory = createRoute({
  method: "put",
  path: "/{id}",
  request: {
    params: CategoryIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateCategorySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: CategorySchema,
        },
      },
      description: "Category updated successfully",
    },
    404: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Category not found",
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

app.openapi(updateCategory, async (c) => {
  const db = getBlogDatabase(c);
  const { id } = c.req.valid("param");
  const data = c.req.valid("json");

  try {
    const updatedCategory = await categoryModule.updateCategory(db, id, data);

    if (!updatedCategory) {
      return c.text("Category not found", 404);
    }

    return c.json(updatedCategory, 200);
  } catch (error) {
    return c.text(`Failed to update category: ${error}`, 400);
  }
});

// DELETE /categories/:id - 删除分类
const deleteCategory = createRoute({
  method: "delete",
  path: "/{id}",
  request: {
    params: CategoryIdParamSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: CategorySchema,
        },
      },
      description: "Category deleted successfully",
    },
    404: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Category not found",
    },
    400: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Category is in use",
    },
  },
});

app.openapi(deleteCategory, async (c) => {
  const db = getBlogDatabase(c);
  const { id } = c.req.valid("param");

  try {
    const deletedCategory = await categoryModule.deleteCategory(db, id);

    if (!deletedCategory) {
      return c.text("Category not found", 404);
    }

    return c.json(deletedCategory, 200);
  } catch (error) {
    return c.text(`Failed to delete category: ${error}`, 400);
  }
});

export default app;
