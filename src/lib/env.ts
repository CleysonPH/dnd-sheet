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

/*
 * Envio de e-mail (design P1). Separado de getEnv(): o seed e as migrações
 * usam getEnv() e não enviam e-mail, então não devem exigir SMTP.
 */
const mailEnvSchema = z
  .object({
    SMTP_HOST: z.string().min(1, "Informe SMTP_HOST"),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535),
    SMTP_SECURE: z
      .enum(["true", "false", ""])
      .optional()
      .transform((value) => value === "true"),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    MAIL_FROM: z.string().min(1, "Informe MAIL_FROM"),
  })
  .transform(({ SMTP_USER, SMTP_PASSWORD, ...rest }) => ({
    ...rest,
    SMTP_USER: SMTP_USER || undefined,
    SMTP_PASSWORD: SMTP_PASSWORD || undefined,
  }))
  .refine((env) => !env.SMTP_USER === !env.SMTP_PASSWORD, {
    path: ["SMTP_PASSWORD"],
    message: "SMTP_USER e SMTP_PASSWORD precisam vir juntos",
  });

export type MailEnv = z.infer<typeof mailEnvSchema>;

/** Valida as variáveis de envio de e-mail. Lança erro legível se inválidas. */
export function parseMailEnv(
  source: Record<string, string | undefined>,
): MailEnv {
  const result = mailEnvSchema.safeParse(source);
  if (!result.success) {
    throw new Error(
      `Variáveis de e-mail inválidas:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

let cachedMail: MailEnv | undefined;

/** Lê e valida as variáveis de e-mail na primeira chamada. */
export function getMailEnv(): MailEnv {
  cachedMail ??= parseMailEnv(process.env);
  return cachedMail;
}
