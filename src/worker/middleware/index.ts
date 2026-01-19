import { MiddlewareHandler } from "hono";
import { Context } from "../types";
import { verifyJWT } from "../lib";

type Handler = MiddlewareHandler<Context>;

// 简单的中间件，目前暂时保留但可能不需要
export const simpleMiddleware = (): Handler => {
  return async (_, next) => {
    // 这里可以添加一些简单的中间件逻辑
    // 比如日志记录、请求验证等
    return next();
  };
};

/**
 * Authentication middleware for protected routes
 * Validates JWT token from Cookie header
 */
export const authMiddleware = (): Handler => {
  return async (c, next) => {
    const env = c.env;

    // Extract token from Cookie header
    const cookies = c.req.header("Cookie");
    const token = cookies?.match(/auth_token=([^;]+)/)?.[1];

    if (!token) {
      return c.json(
        {
          error: "MISSING_TOKEN",
          message: "Missing authentication token",
        },
        401,
      );
    }

    // Verify JWT
    try {
      const payload = await verifyJWT(token, env.JWT_SECRET);

      // Check if user is admin
      if (payload.role !== "admin") {
        return c.json(
          {
            error: "FORBIDDEN",
            message: "Permission denied",
          },
          403,
        );
      }

      // Store user info in context
      c.set("user", {
        id: payload.sub,
        role: payload.role,
      });

      return next();
    } catch (error) {
      const message = error instanceof Error ? error.message : "INVALID_TOKEN";

      const statusCode = message === "TOKEN_EXPIRED" ? 401 : 401;
      const errorMessage =
        message === "TOKEN_EXPIRED"
          ? "Token has expired"
          : message === "INVALID_SIGNATURE"
            ? "Invalid token signature"
            : "Invalid token format";

      return c.json(
        {
          error: message,
          message: errorMessage,
        },
        statusCode,
      );
    }
  };
};
