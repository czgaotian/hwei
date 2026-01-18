import { MiddlewareHandler } from "hono";
import { Context } from "../types";

type Handler = MiddlewareHandler<Context>;

// 简单的中间件，目前暂时保留但可能不需要
export const simpleMiddleware = (): Handler => {
  return async (_, next) => {
    // 这里可以添加一些简单的中间件逻辑
    // 比如日志记录、请求验证等
    return next();
  };
};
