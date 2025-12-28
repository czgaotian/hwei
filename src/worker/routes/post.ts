import * as postModule from "../module/posts";
import { getBlogDatabase } from "../lib/db";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { Context } from "../types";
import { json200Response, json401Response, requestBody } from "../lib/openapi";
import {
  PostSchema,
  CreatePostSchema,
  UpdatePostSchema,
  PostIdParamSchema,
} from "../lib/validation";

const app = new OpenAPIHono<Context>();

// GET /posts - 获取所有文章列表
const getPosts = createRoute({
  method: "get",
  path: "/",
  responses: {
    ...json200Response(z.array(PostSchema), "List of blog posts"),
    ...json401Response,
  },
});

app.openapi(getPosts, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const db = getBlogDatabase(c);
  const posts = await postModule.getPosts(db);
  return c.json(posts, 200);
});

// GET /posts/:id - 获取单个文章
const getPost = createRoute({
  method: "get",
  path: "/{id}",
  request: {
    params: PostIdParamSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PostSchema,
        },
      },
      description: "Post details",
    },
    404: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Post not found",
    },
    ...json401Response,
  },
});

app.openapi(getPost, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const db = getBlogDatabase(c);
  const { id } = c.req.valid("param");

  const post = await postModule.getPostById(db, id);

  if (!post) {
    return c.text("Post not found", 404);
  }

  return c.json(post, 200);
});

// POST /posts - 创建新文章
const createPost = createRoute({
  method: "post",
  path: "/",
  ...requestBody(CreatePostSchema),
  responses: {
    201: {
      content: {
        "application/json": {
          schema: PostSchema,
        },
      },
      description: "Post created successfully",
    },
    400: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Invalid request data",
    },
    ...json401Response,
  },
});

app.openapi(createPost, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const db = getBlogDatabase(c);
  const data = c.req.valid("json");

  try {
    const newPost = await postModule.createPost(db, data);
    return c.json(newPost, 201);
  } catch (error) {
    return c.text(`Failed to create post: ${error}`, 400);
  }
});

// PUT /posts/:id - 更新文章
const updatePost = createRoute({
  method: "put",
  path: "/{id}",
  request: {
    params: PostIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdatePostSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PostSchema,
        },
      },
      description: "Post updated successfully",
    },
    404: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Post not found",
    },
    400: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Invalid request data",
    },
    ...json401Response,
  },
});

app.openapi(updatePost, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const db = getBlogDatabase(c);
  const { id } = c.req.valid("param");
  const data = c.req.valid("json");

  try {
    const updatedPost = await postModule.updatePost(db, id, data);

    if (!updatedPost) {
      return c.text("Post not found", 404);
    }

    return c.json(updatedPost, 200);
  } catch (error) {
    return c.text(`Failed to update post: ${error}`, 400);
  }
});

// DELETE /posts/:id - 删除文章
const deletePost = createRoute({
  method: "delete",
  path: "/{id}",
  request: {
    params: PostIdParamSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PostSchema,
        },
      },
      description: "Post deleted successfully",
    },
    404: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Post not found",
    },
    ...json401Response,
  },
});

app.openapi(deletePost, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const db = getBlogDatabase(c);
  const { id } = c.req.valid("param");

  const deletedPost = await postModule.deletePost(db, id);

  if (!deletedPost) {
    return c.text("Post not found", 404);
  }

  return c.json(deletedPost, 200);
});

export default app;
