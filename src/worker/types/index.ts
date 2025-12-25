import type { User, Session } from "lucia";
import { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";

export type DrizzleDB = DrizzleD1Database<typeof schema>;

export type Context = {
  Bindings: Env;
  Variables: {
    user: User | null;
    session: Session | null;
    db: DrizzleDB;
  };
};
