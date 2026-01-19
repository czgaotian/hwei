import { OpenAPIHono } from "@hono/zod-openapi";
import { Context } from "./types";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import routes from "./routes";

const app = new OpenAPIHono<Context>();

app.use("/api/*", prettyJSON());

// CORS configuration to support cookies
app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      // In production, replace with your actual domain
      // For development, allow localhost and common dev ports
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
      ];

      // Add your production domain from environment if available
      // if (process.env.ALLOWED_ORIGIN) {
      //   allowedOrigins.push(process.env.ALLOWED_ORIGIN);
      // }

      return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Important: allow cookies
    maxAge: 86400, // 24 hours
  }),
);

app.route("/api", routes);

export default app;
