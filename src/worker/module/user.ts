import { DrizzleDB } from "../types";
import { user } from "../db/schema";
import { eq } from "drizzle-orm";
import { Scrypt } from "lucia";

export const createUser = async (
  db: DrizzleDB,
  email: string,
  password: string
) => {
  const scrypt = new Scrypt();
  const hashedPassword = await scrypt.hash(password);
  return await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      email,
      password: hashedPassword,
    })
    .returning()
    .get();
};

export const getUserById = async (db: DrizzleDB, id: string) => {
  const users = await db.select().from(user).where(eq(user.id, id)).limit(1);
  return users[0];
};

export const getUserByEmail = async (db: DrizzleDB, email: string) => {
  const users = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  return users[0];
};
