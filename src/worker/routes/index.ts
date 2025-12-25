import { OpenAPIHono } from "@hono/zod-openapi";
import { Context } from "../types";
import authRoutes from "./auth";
import postRoutes from "./post";

const router = new OpenAPIHono<Context>();
router.route("/auth", authRoutes);
router.route("/posts", postRoutes);

export default router;
