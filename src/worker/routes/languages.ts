import * as languageModule from "../module/languages";
import { getBlogDatabase } from "../lib/db";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { Context } from "../types";
import { json200Response, json401Response, requestBody } from "../lib/openapi";
import {
  LanguageSchema,
  CreateLanguageSchema,
  LanguageIdParamSchema,
} from "../lib/validation";

const app = new OpenAPIHono<Context>();

// GET /languages - 获取所有语言列表
const getLanguages = createRoute({
  method: "get",
  path: "/",
  responses: {
    ...json200Response(z.array(LanguageSchema), "List of languages"),
    ...json401Response,
  },
});

app.openapi(getLanguages, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const db = getBlogDatabase(c);
  const languages = await languageModule.getLanguages(db);
  return c.json(languages, 200);
});

// GET /languages/:id - 获取单个语言
const getLanguage = createRoute({
  method: "get",
  path: "/{id}",
  request: {
    params: LanguageIdParamSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: LanguageSchema,
        },
      },
      description: "Language details",
    },
    404: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Language not found",
    },
    ...json401Response,
  },
});

app.openapi(getLanguage, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const db = getBlogDatabase(c);
  const { id } = c.req.valid("param");

  const language = await languageModule.getLanguageById(db, id);

  if (!language) {
    return c.text("Language not found", 404);
  }

  return c.json(language, 200);
});

// POST /languages - 创建新语言
const createLanguage = createRoute({
  method: "post",
  path: "/",
  ...requestBody(CreateLanguageSchema),
  responses: {
    201: {
      content: {
        "application/json": {
          schema: LanguageSchema,
        },
      },
      description: "Language created successfully",
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

app.openapi(createLanguage, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const db = getBlogDatabase(c);
  const data = c.req.valid("json");

  try {
    const newLanguage = await languageModule.createLanguage(db, data);
    return c.json(newLanguage, 201);
  } catch (error) {
    return c.text(`Failed to create language: ${error}`, 400);
  }
});

// DELETE /languages/:id - 删除语言
const deleteLanguage = createRoute({
  method: "delete",
  path: "/{id}",
  request: {
    params: LanguageIdParamSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: LanguageSchema,
        },
      },
      description: "Language deleted successfully",
    },
    404: {
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
      description: "Language not found",
    },
    ...json401Response,
  },
});

app.openapi(deleteLanguage, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const db = getBlogDatabase(c);
  const { id } = c.req.valid("param");

  const deletedLanguage = await languageModule.deleteLanguage(db, id);

  if (!deletedLanguage) {
    return c.text("Language not found", 404);
  }

  return c.json(deletedLanguage, 200);
});

export default app;
