import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";

import { testDatabaseUrl } from "./database-url";
import { MAILPIT_URL } from "./mailpit-url";

/** Confere se o Mailpit responde (design P8). */
async function checkMailpit() {
  try {
    const response = await fetch(`${MAILPIT_URL}/api/v1/info`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    throw new Error(
      `Não foi possível falar com o Mailpit em ${MAILPIT_URL}. ` +
        "Rode `docker compose --profile dev up -d` antes dos testes de integração.",
      { cause: error },
    );
  }
}

/**
 * Confere o Mailpit, cria o banco de teste se não existir e aplica as
 * migrações.
 */
export default async function setup() {
  await checkMailpit();

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
        "Rode `docker compose --profile dev up -d` antes dos testes de integração.",
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
