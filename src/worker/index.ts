import { Hono } from "hono";
import { prettyJSON } from "hono/pretty-json";
import api from "./api";

const app = new Hono();

const middleware = new Hono<{ Bindings: Env }>();

middleware.use("*", prettyJSON());
app.route("/api", middleware);
app.route("/api", api);

export default app;
