import { initializeLucia } from "../lib/auth";
import { getCookie } from "hono/cookie";
import { verifyRequestOrigin } from "lucia";
import { MiddlewareHandler } from "hono";
import { Context } from "../types";

type Handler = MiddlewareHandler<Context>;

export const csrf = (): Handler => {
  return async (c, next) => {
    // CSRF middleware
    if (c.req.method === "GET") {
      return next();
    }
    const originHeader = c.req.header("Origin");
    const hostHeader = c.req.header("Host");
    if (
      !originHeader ||
      !hostHeader ||
      !verifyRequestOrigin(originHeader, [hostHeader])
    ) {
      return c.body(null, 403);
    }
    return next();
  };
};

export const validateRequest = (): Handler => {
  return async (c, next) => {
    const lucia = initializeLucia(c.env.BLOG_DATABASE);
    const sessionId = getCookie(c, lucia.sessionCookieName) ?? null;

    if (!sessionId) {
      c.set("user", null);
      c.set("session", null);
      return next();
    }

    const { session, user } = await lucia.validateSession(sessionId);

    if (session && session.fresh) {
      // use `header()` instead of `setCookie()` to avoid TS errors
      c.header(
        "Set-Cookie",
        lucia.createSessionCookie(session.id).serialize(),
        {
          append: true,
        }
      );
    }

    if (!session) {
      c.header("Set-Cookie", lucia.createBlankSessionCookie().serialize(), {
        append: true,
      });
    }

    c.set("user", user);
    c.set("session", session);

    return next();
  };
};

export const unauthenticatedOnly = (): Handler => {
  return async (c, next) => {
    const user = c.var.user;
    console.log("User:", user);
    if (user) {
      return c.redirect("/");
    }
    return next();
  };
};

export const authenticatedOnly = (): Handler => {
  return async (c, next) => {
    const user = c.var.user;
    if (!user) {
      return c.redirect("/login");
    }
    return next();
  };
};
