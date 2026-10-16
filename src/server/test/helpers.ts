import { sql } from "drizzle-orm";

import { getAuth } from "@/server/auth";
import { getDb } from "@/server/db";

/** Apaga todos os dados entre testes. */
export async function resetDatabase() {
  await getDb().execute(
    sql`truncate table "session", "account", "verification", "user", "rate_limit", "compendium_entry" cascade`,
  );
}

type TestUserOptions = {
  name?: string;
  email: string;
  password?: string;
  role?: "user" | "admin";
  mustChangePassword?: boolean;
};

export const TEST_PASSWORD = "senha-de-teste-123";

/** Cria uma conta direto pelo Better Auth (sem as regras do admin). */
export async function createTestUser(options: TestUserOptions) {
  const { user } = await getAuth().api.createUser({
    body: {
      name: options.name ?? options.email.split("@")[0]!,
      email: options.email,
      password: options.password ?? TEST_PASSWORD,
      role: options.role ?? "user",
      data: { mustChangePassword: options.mustChangePassword ?? false },
    },
  });
  return user;
}

/** Faz login e devolve os headers com o cookie da sessão, como um navegador faria. */
export async function signIn(email: string, password = TEST_PASSWORD) {
  const response = await getAuth().api.signInEmail({
    body: { email, password },
    asResponse: true,
  });
  if (!response.ok) {
    throw new Error(`Login de teste falhou (${response.status})`);
  }
  const cookies = response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
  return new Headers({ cookie: cookies });
}
