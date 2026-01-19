import { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";

export type DrizzleDB = DrizzleD1Database<typeof schema>;

export interface User {
  id: string;
  role: string;
}

export type Context = {
  Bindings: Env;
  Variables: {
    db: DrizzleDB;
    user?: User;
  };
};
