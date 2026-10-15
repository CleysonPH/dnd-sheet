import "server-only";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { getAuth } from "@/server/auth";
import { passwordSchema } from "@/lib/password";
import { getDb } from "@/server/db";
import { user } from "@/server/db/schema";

const seedEnvSchema = z.object({
  SEED_ADMIN_NAME: z.string().trim().min(1),
  SEED_ADMIN_EMAIL: z.string().trim().toLowerCase().pipe(z.email()),
  SEED_ADMIN_PASSWORD: passwordSchema,
});

export type SeedResult =
  { created: true; email: string } | { created: false; email: string };

/**
 * Cria o primeiro admin a partir das variáveis SEED_ADMIN_* (design A9). Não
 * altera nada se o e-mail já existir. O admin precisa trocar a senha no
 * primeiro login.
 */
export async function seedAdmin(
  source: Record<string, string | undefined>,
): Promise<SeedResult> {
  const parsed = seedEnvSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(
      `Variáveis do seed inválidas:\n${z.prettifyError(parsed.error)}`,
    );
  }
  const { SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } =
    parsed.data;

  const [existing] = await getDb()
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, SEED_ADMIN_EMAIL));
  if (existing) return { created: false, email: SEED_ADMIN_EMAIL };

  await getAuth().api.createUser({
    body: {
      name: SEED_ADMIN_NAME,
      email: SEED_ADMIN_EMAIL,
      password: SEED_ADMIN_PASSWORD,
      role: "admin",
      data: { mustChangePassword: true },
    },
  });
  return { created: true, email: SEED_ADMIN_EMAIL };
}
