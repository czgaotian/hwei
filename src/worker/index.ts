import { OpenAPIHono } from "@hono/zod-openapi";
import { Context } from "./types";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import routes from "./routes";

const app = new OpenAPIHono<Context>();

app.use("/api/*", prettyJSON());
app.use(
  "/api/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

app.route("/api", routes);

export default app;
