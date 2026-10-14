// Usado só pela CLI do Better Auth (`npm run auth:generate`) para gerar o schema
// Drizzle. A conexão nunca é aberta: a CLI só lê a configuração.
import { drizzle } from "drizzle-orm/node-postgres";

import { createAuth } from "../src/server/auth/config";
import * as schema from "../src/server/db/schema";

export const auth = createAuth({
  db: drizzle("postgresql://cli:cli@localhost:5432/cli", { schema }),
  secret: "x".repeat(32),
  baseURL: "http://localhost:3000",
});
