import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";

import { testDatabaseUrl } from "./database-url";

/** Cria o banco de teste se não existir e aplica as migrações. */
export default async function setup() {
  const testUrl = new URL(testDatabaseUrl());
  const dbName = testUrl.pathname.slice(1);
  const adminUrl = new URL(testUrl);
  adminUrl.pathname = "/postgres";

  const admin = new Client({ connectionString: adminUrl.toString() });
  try {
    await admin.connect();
  } catch (error) {
    throw new Error(
      `Não foi possível conectar ao Postgres em ${adminUrl.host}. ` +
        "Rode `docker compose up -d db` antes dos testes de integração.",
      { cause: error },
    );
  }
  try {
    const { rowCount } = await admin.query(
      "select 1 from pg_database where datname = $1",
      [dbName],
    );
    if (!rowCount) await admin.query(`create database "${dbName}"`);
  } finally {
    await admin.end();
  }

  const client = new Client({ connectionString: testUrl.toString() });
  await client.connect();
  try {
    await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  } finally {
    await client.end();
  }
}
