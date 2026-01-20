import { OpenAPIHono } from "@hono/zod-openapi";
import { Context } from "../types";
import articleRoutes from "./articles";
import categoryRoutes from "./categories";
import tagRoutes from "./tags";
import mediaRoutes from "./media";
import authRoutes from "./auth";
import { authMiddleware } from "../middleware";

const router = new OpenAPIHono<Context>();

// Public routes - no authentication required
router.route("/auth", authRoutes);

// Protected routes - authentication required
router.use("*", authMiddleware());
router.route("/tags", tagRoutes);
router.route("/articles", articleRoutes);
router.route("/categories", categoryRoutes);
router.route("/media", mediaRoutes);

export default router;
