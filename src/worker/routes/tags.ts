import * as tagModule from "../module/tags";
import { getBlogDatabase } from "../lib/db";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { Context } from "../types";
import { requestBody } from "../lib/openapi";
import {
  TagSchema,
  CreateTagSchema,
  UpdateTagSchema,
  TagIdParamSchema,
  PaginationQuerySchema,
  PaginatedResponseSchema,
} from "../lib/validation";

const app = new OpenAPIHono<Context>();

// GET /tags - 获取所有标签列表
const getTags = createRoute({
  method: "get",
  path: "/",
  request: {
    query: PaginationQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PaginatedResponseSchema(TagSchema),
        },
      },
      description: "Paginated list of tags",
    },
  },
});

app.openapi(getTags, async (c) => {
  const db = getBlogDatabase(c);
  const { page, pageSize, search } = c.req.valid("query");

  const { data, total } = await tagModule.getTags(db, {
    page,
    pageSize,
    search,
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

// GET /tags/:id - 获取单个标签
const getTag = createRoute({
  method: "get",
  path: "/{id}",
  request: {
    params: TagIdParamSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TagSchema,
        },
      },
      description: "Tag details",
    },
    404: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Tag not found",
    },
  },
});

app.openapi(getTag, async (c) => {
  const db = getBlogDatabase(c);
  const { id } = c.req.valid("param");

  const tag = await tagModule.getTagById(db, id);

  if (!tag) {
    return c.text("Tag not found", 404);
  }

  return c.json(tag, 200);
});

// POST /tags - 创建新标签
const createTag = createRoute({
  method: "post",
  path: "/",
  ...requestBody(CreateTagSchema),
  responses: {
    201: {
      content: {
        "application/json": {
          schema: TagSchema,
        },
      },
      description: "Tag created successfully",
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

app.openapi(createTag, async (c) => {
  const db = getBlogDatabase(c);
  const data = c.req.valid("json");

  try {
    const newTag = await tagModule.createTag(db, data);
    return c.json(newTag, 201);
  } catch (error) {
    return c.text(`Failed to create tag: ${error}`, 400);
  }
});

// PUT /tags/:id - 更新标签
const updateTag = createRoute({
  method: "put",
  path: "/{id}",
  request: {
    params: TagIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateTagSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TagSchema,
        },
      },
      description: "Tag updated successfully",
    },
    404: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Tag not found",
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

app.openapi(updateTag, async (c) => {
  const db = getBlogDatabase(c);
  const { id } = c.req.valid("param");
  const data = c.req.valid("json");

  try {
    const updatedTag = await tagModule.updateTag(db, id, data);

    if (!updatedTag) {
      return c.text("Tag not found", 404);
    }

    return c.json(updatedTag, 200);
  } catch (error) {
    return c.text(`Failed to update tag: ${error}`, 400);
  }
});

// DELETE /tags/:id - 删除标签
const deleteTag = createRoute({
  method: "delete",
  path: "/{id}",
  request: {
    params: TagIdParamSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TagSchema,
        },
      },
      description: "Tag deleted successfully",
    },
    404: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Tag not found",
    },
  },
});

app.openapi(deleteTag, async (c) => {
  const db = getBlogDatabase(c);
  const { id } = c.req.valid("param");

  const deletedTag = await tagModule.deleteTag(db, id);

  if (!deletedTag) {
    return c.text("Tag not found", 404);
  }

  return c.json(deletedTag, 200);
});

export default app;
