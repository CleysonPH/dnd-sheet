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
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
