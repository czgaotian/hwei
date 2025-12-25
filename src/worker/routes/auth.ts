import { Context } from "../types";
import * as userModule from "../module/user";
import { Scrypt } from "lucia";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { json401Response, redirectResponse, requestBody } from "../lib/openapi";
import { initializeLucia, getBlogDatabase } from "../lib";
import { signupParamsSchema } from "../lib/validation";

const app = new OpenAPIHono<Context>();

const signup = createRoute({
  method: "post",
  path: "/signup",
  ...requestBody(signupParamsSchema),
  responses: {
    ...redirectResponse("Redirect to home page", "/"),
    ...json401Response,
  },
});

app.openapi(signup, async (c) => {
  const db = getBlogDatabase(c);
  const lucia = initializeLucia(c.env.BLOG_DATABASE);
  const { email, password } = c.req.valid("json");

  // check if email already exists
  const existing = await userModule.getUserByEmail(db, email);
  if (existing) {
    return c.text(`Invalid Email or Password`, 400);
  }

  const newUser = await userModule.createUser(db, email, password);

  // Create Session
  const session = await lucia.createSession(newUser.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  c.header("Set-Cookie", sessionCookie.serialize(), {
    append: true,
  });

  console.log(email, password);
  return c.redirect("/");
});

const login = createRoute({
  method: "post",
  path: "/login",
  ...requestBody(signupParamsSchema),
  responses: {
    ...redirectResponse("Redirect to home page", "/"),
    ...json401Response,
  },
});

app.openapi(login, async (c) => {
  const db = getBlogDatabase(c);
  const { email, password } = c.req.valid("json");
  const lucia = initializeLucia(c.env.BLOG_DATABASE);

  const user = await userModule.getUserByEmail(db, email);

  if (!user) {
    return c.text(`Invalid Email or Password`, 400);
  }

  const scrypt = new Scrypt();
  const isValid = await scrypt.verify(user.password, password);

  if (!isValid) {
    return c.text(`Invalid Email or Password`, 400);
  }

  const session = await lucia.createSession(user.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  c.header("Set-Cookie", sessionCookie.serialize(), {
    append: true,
  });

  return c.redirect("/");
});

const logout = createRoute({
  method: "get",
  path: "/logout",
  responses: {
    ...redirectResponse("Redirect to home page", "/"),
    ...json401Response,
  },
});

app.openapi(logout, async (c) => {
  const lucia = initializeLucia(c.env.BLOG_DATABASE);
  const session = c.get("session");

  if (session) {
    const blankSession = lucia.createBlankSessionCookie();
    c.header("Set-Cookie", blankSession.serialize(), {
      append: true,
    });
  }

  return c.redirect("/");
});

export default app;
