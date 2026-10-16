import "server-only";

import { attachDatabasePool } from "@vercel/functions";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";

import { getEnv } from "@/lib/env";

import { RetryingPool } from "./retrying-pool";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

let pool: RetryingPool | undefined;
let db: Database | undefined;

/**
 * Pool único, criado na primeira chamada para que o build não precise do banco.
 * Na Vercel, attachDatabasePool libera as conexões ociosas antes de a função
 * suspender; fora dela, não faz nada (design Y2).
 */
export function getPool(): RetryingPool {
  if (!pool) {
    pool = new RetryingPool({ connectionString: getEnv().DATABASE_URL });
    attachDatabasePool(pool);
  }
  return pool;
}

export function getDb(): Database {
  db ??= drizzle(getPool(), { schema });
  return db;
}
