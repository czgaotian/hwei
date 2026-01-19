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

// Admin routes - authentication required
const adminRouter = new OpenAPIHono<Context>();
adminRouter.use("/*", authMiddleware());
adminRouter.route("/articles", articleRoutes);
adminRouter.route("/categories", categoryRoutes);
adminRouter.route("/tags", tagRoutes);
adminRouter.route("/media", mediaRoutes);

router.route("/admin", adminRouter);

export default router;
