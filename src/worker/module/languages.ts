import { DrizzleDB } from "../types";
import { languages } from "../db/schema";
import { eq } from "drizzle-orm";

export const getLanguages = async (db: DrizzleDB) => {
  return await db.select().from(languages);
};

export const getLanguageById = async (db: DrizzleDB, id: number) => {
  const result = await db.select().from(languages).where(eq(languages.id, id));
  return result[0] || null;
};

export const createLanguage = async (
  db: DrizzleDB,
  data: {
    lang: string;
    locale: string;
    isDefault?: boolean;
  }
) => {
  const result = await db.insert(languages).values(data).returning();
  return result[0];
};

export const deleteLanguage = async (db: DrizzleDB, id: number) => {
  const result = await db
    .delete(languages)
    .where(eq(languages.id, id))
    .returning();
  return result[0] || null;
};
