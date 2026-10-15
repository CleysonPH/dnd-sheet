import { defineConfig } from "drizzle-kit";

// O drizzle-kit não lê o .env sozinho. Em produção as variáveis já vêm do ambiente.
try {
  process.loadEnvFile();
} catch {
  // sem .env: usa só o ambiente
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  // Migrações pela URL direta: o pooler do Neon não serve para DDL em
  // transação (design Y1). Sem ela, a mesma URL da aplicação (desenvolvimento).
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
});
