import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET precisa ter pelo menos 32 caracteres"),
  BETTER_AUTH_URL: z.url({ protocol: /^https?$/ }),
});

export type Env = z.infer<typeof envSchema>;

/** Valida um conjunto de variáveis de ambiente. Lança erro legível se inválido. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(
      `Variáveis de ambiente inválidas:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

let cached: Env | undefined;

/**
 * Lê e valida process.env na primeira chamada, não no import, para que
 * `next build` funcione sem as variáveis de runtime (ex.: dentro do Docker).
 */
export function getEnv(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
