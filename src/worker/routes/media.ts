import * as mediaModule from "../module/media";
import { getBlogDatabase } from "../lib/db";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { Context } from "../types";
import { requestBody } from "../lib/openapi";
import {
  MediaSchema,
  CreateMediaSchema,
  MediaIdParamSchema,
  PaginationQuerySchema,
  PaginatedResponseSchema,
} from "../lib/validation";

const app = new OpenAPIHono<Context>();

// GET /media - 获取所有媒体文件列表
const getMediaList = createRoute({
  method: "get",
  path: "/",
  request: {
    query: PaginationQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PaginatedResponseSchema(MediaSchema),
        },
      },
      description: "Paginated list of media files",
    },
  },
});

app.openapi(getMediaList, async (c) => {
  const db = getBlogDatabase(c);
  const { page, pageSize, search } = c.req.valid("query");

  const { data, total } = await mediaModule.getMediaList(db, {
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

// GET /media/:id - 获取单个媒体文件
const getMedia = createRoute({
  method: "get",
  path: "/{id}",
  request: {
    params: MediaIdParamSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: MediaSchema,
        },
      },
      description: "Media file details",
    },
    404: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Media file not found",
    },
  },
});

app.openapi(getMedia, async (c) => {
  const db = getBlogDatabase(c);
  const { id } = c.req.valid("param");

  const media = await mediaModule.getMediaById(db, id);

  if (!media) {
    return c.text("Media file not found", 404);
  }

  return c.json(media, 200);
});

// POST /media - 创建新媒体文件记录
const createMedia = createRoute({
  method: "post",
  path: "/",
  ...requestBody(CreateMediaSchema),
  responses: {
    201: {
      content: {
        "application/json": {
          schema: MediaSchema,
        },
      },
      description: "Media file created successfully",
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

app.openapi(createMedia, async (c) => {
  const db = getBlogDatabase(c);
  const data = c.req.valid("json");

  try {
    const newMedia = await mediaModule.createMedia(db, data);
    return c.json(newMedia, 201);
  } catch (error) {
    return c.text(`Failed to create media: ${error}`, 400);
  }
});

// DELETE /media/:id - 删除媒体文件
const deleteMedia = createRoute({
  method: "delete",
  path: "/{id}",
  request: {
    params: MediaIdParamSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: MediaSchema,
        },
      },
      description: "Media file deleted successfully",
    },
    404: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Media file not found",
    },
    400: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Media file is in use",
    },
  },
});

app.openapi(deleteMedia, async (c) => {
  const db = getBlogDatabase(c);
  const { id } = c.req.valid("param");

  try {
    const deletedMedia = await mediaModule.deleteMedia(db, id);

    if (!deletedMedia) {
      return c.text("Media file not found", 404);
    }

    return c.json(deletedMedia, 200);
  } catch (error) {
    return c.text(`Failed to delete media: ${error}`, 400);
  }
});

export default app;
