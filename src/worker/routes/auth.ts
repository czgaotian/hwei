import { OpenAPIHono } from "@hono/zod-openapi";
import { Context } from "../types";
import { z } from "zod";
import { generateJWT, verifyJWT } from "../lib";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { authMiddleware } from "../middleware";

const authRouter = new OpenAPIHono<Context>();

// Login schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Change password schema
const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

// Register schema (for initial setup)
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

/**
 * POST /api/auth/register
 * Register initial admin user (only works if no users exist)
 */
authRouter.post("/register", async (c) => {
  try {
    const body = await c.req.json();
    const validated = registerSchema.parse(body);
    const db = c.get("db");

    // Check if any users exist
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      return c.json(
        {
          error: "FORBIDDEN",
          message: "User already exists. Registration is disabled.",
        },
        403,
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validated.password, 10);

    // Create user
    const userId = crypto.randomUUID();
    await db.insert(users).values({
      id: userId,
      username: validated.username,
      password: passwordHash,
    });

    return c.json(
      {
        message: "Admin user created successfully",
      },
      201,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: "INVALID_REQUEST",
          message: "Invalid request payload",
          details: error.issues,
        },
        400,
      );
    }

    console.error("Register error:", error);
    return c.json(
      {
        error: "INTERNAL_ERROR",
        message: "Internal server error",
      },
      500,
    );
  }
});

/**
 * POST /api/auth/login
 * Login with username and password
 */
authRouter.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    const validated = loginSchema.parse(body);
    const db = c.get("db");
    const env = c.env;

    // Find user by username
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, validated.username))
      .limit(1);

    if (!user) {
      return c.json(
        {
          error: "INVALID_CREDENTIALS",
          message: "Invalid username or password",
        },
        401,
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      validated.password,
      user.password,
    );

    if (!isPasswordValid) {
      return c.json(
        {
          error: "INVALID_CREDENTIALS",
          message: "Invalid username or password",
        },
        401,
      );
    }

    // Generate JWT
    const token = await generateJWT(
      {
        sub: user.id,
        role: "admin",
      },
      env.JWT_SECRET,
    );

    // Set cookie
    const response = c.json({
      message: "Login successful",
    });

    // Set HttpOnly cookie
    response.headers.set(
      "Set-Cookie",
      `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=1800; Path=/`,
    );

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: "INVALID_REQUEST",
          message: "Invalid request payload",
          details: error.issues,
        },
        400,
      );
    }

    console.error("Login error:", error);
    return c.json(
      {
        error: "INTERNAL_ERROR",
        message: "Internal server error",
      },
      500,
    );
  }
});

/**
 * POST /api/auth/logout
 * Logout and clear cookie
 */
authRouter.post("/logout", async (c) => {
  const response = c.json({
    message: "Logout successful",
  });

  // Clear cookie
  response.headers.set(
    "Set-Cookie",
    `auth_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`,
  );

  return response;
});

/**
 * GET /api/auth/verify
 * Verify if current token is valid
 */
authRouter.get("/verify", authMiddleware(), async (c) => {
  const cookies = c.req.header("Cookie");
  const token = cookies?.match(/auth_token=([^;]+)/)?.[1];

  if (!token) {
    return c.json(
      {
        valid: false,
        error: "MISSING_TOKEN",
      },
      401,
    );
  }

  try {
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    const expiresIn = payload.exp
      ? payload.exp - Math.floor(Date.now() / 1000)
      : 0;

    return c.json({
      valid: true,
      expiresIn: expiresIn > 0 ? expiresIn : 0,
    });
  } catch (error) {
    return c.json(
      {
        valid: false,
        error: error instanceof Error ? error.message : "INVALID_TOKEN",
      },
      401,
    );
  }
});

/**
 * POST /api/auth/change-password
 * Change password for authenticated user
 */
authRouter.post("/change-password", authMiddleware(), async (c) => {
  try {
    const body = await c.req.json();
    const validated = changePasswordSchema.parse(body);
    const db = c.get("db");
    const user = c.get("user");

    if (!user) {
      return c.json(
        {
          error: "FORBIDDEN",
          message: "Permission denied",
        },
        403,
      );
    }

    // Get current user
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!currentUser) {
      return c.json(
        {
          error: "FORBIDDEN",
          message: "User not found",
        },
        404,
      );
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(
      validated.oldPassword,
      currentUser.password,
    );

    if (!isOldPasswordValid) {
      return c.json(
        {
          error: "INVALID_CREDENTIALS",
          message: "Old password is incorrect",
        },
        401,
      );
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(validated.newPassword, 10);

    // Update password
    await db
      .update(users)
      .set({
        password: newPasswordHash,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(users.id, user.id));

    return c.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: "INVALID_REQUEST",
          message: "Invalid request payload",
          details: error.issues,
        },
        400,
      );
    }

    console.error("Change password error:", error);
    return c.json(
      {
        error: "INTERNAL_ERROR",
        message: "Internal server error",
      },
      500,
    );
  }
});

export default authRouter;
