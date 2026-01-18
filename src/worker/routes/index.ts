import { OpenAPIHono } from "@hono/zod-openapi";
import { Context } from "../types";
import articleRoutes from "./articles";
import categoryRoutes from "./categories";
import tagRoutes from "./tags";
import mediaRoutes from "./media";

const router = new OpenAPIHono<Context>();
router.route("/articles", articleRoutes);
router.route("/categories", categoryRoutes);
router.route("/tags", tagRoutes);
router.route("/media", mediaRoutes);

export default router;
