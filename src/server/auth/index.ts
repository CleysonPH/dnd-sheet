import "server-only";

import { getEnv } from "@/lib/env";
import { getDb } from "@/server/db";

import { createAuth, type Auth } from "./config";

let auth: Auth | undefined;

/** Instância única do Better Auth, criada na primeira chamada (o build não precisa do .env). */
export function getAuth(): Auth {
  if (!auth) {
    const env = getEnv();
    auth = createAuth({
      db: getDb(),
      secret: env.BETTER_AUTH_SECRET,
      baseURL: env.BETTER_AUTH_URL,
    });
  }
  return auth;
}
