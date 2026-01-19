import { SignJWT, jwtVerify } from "jose";

export interface JWTPayload {
  sub: string; // user id
  role: string; // user role
  iat?: number; // issued at
  exp?: number; // expiration time
}

/**
 * Generate JWT token
 * @param payload - Token payload
 * @param secret - JWT secret
 * @param expiresIn - Token expiration time in seconds (default: 30 minutes)
 */
export async function generateJWT(
  payload: Omit<JWTPayload, "iat" | "exp">,
  secret: string,
  expiresIn: number = 30 * 60, // 30 minutes
): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  return await new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(secretKey);
}

/**
 * Verify JWT token
 * @param token - JWT token
 * @param secret - JWT secret
 * @returns Token payload if valid
 * @throws Error if token is invalid or expired
 */
export async function verifyJWT(
  token: string,
  secret: string,
): Promise<JWTPayload> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as JWTPayload;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("expired")) {
        throw new Error("TOKEN_EXPIRED");
      }
      if (error.message.includes("signature")) {
        throw new Error("INVALID_SIGNATURE");
      }
    }
    throw new Error("INVALID_TOKEN");
  }
}
