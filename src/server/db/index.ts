import "server-only";

import { attachDatabasePool } from "@vercel/functions";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { getEnv } from "@/lib/env";

import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

let pool: Pool | undefined;
let db: Database | undefined;

/**
 * Pool único, criado na primeira chamada para que o build não precise do banco.
 * Na Vercel, attachDatabasePool libera as conexões ociosas antes de a função
 * suspender; fora dela, não faz nada (design Y2).
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: getEnv().DATABASE_URL });
    attachDatabasePool(pool);
  }
  return pool;
}

export function getDb(): Database {
  db ??= drizzle(getPool(), { schema });
  return db;
}
