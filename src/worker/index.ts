import { Hono } from "hono";
import { prettyJSON } from "hono/pretty-json";
import api from "./api";

const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", prettyJSON());
app.route("/api", api);

export default app;
