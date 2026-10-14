import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";

import type { Database } from "@/server/db";

const DAY = 60 * 60 * 24;

/** Mensagem exibida no login de uma conta desativada (spec authentication). */
export const DEACTIVATED_ACCOUNT_MESSAGE =
  "Conta desativada. Fale com o administrador.";

/**
 * Endpoints HTTP desligados. As ações de admin passam por src/server/accounts,
 * que chama auth.api no servidor (disabledPaths só vale para HTTP). Isso impede
 * cadastro público, impersonação e exclusão de contas (design A3).
 */
export const DISABLED_PATHS = [
  "/sign-up/email",
  "/admin/set-role",
  "/admin/get-user",
  "/admin/create-user",
  "/admin/update-user",
  "/admin/list-users",
  "/admin/list-user-sessions",
  "/admin/unban-user",
  "/admin/ban-user",
  "/admin/impersonate-user",
  "/admin/stop-impersonating",
  "/admin/revoke-user-session",
  "/admin/revoke-user-sessions",
  "/admin/remove-user",
  "/admin/set-user-password",
  "/admin/has-permission",
];

/** Monta a instância do Better Auth. Sem `server-only`, para a CLI conseguir carregá-la. */
export function createAuth(options: {
  db: Database;
  secret: string;
  baseURL: string;
}) {
  return betterAuth({
    secret: options.secret,
    baseURL: options.baseURL,
    database: drizzleAdapter(options.db, { provider: "pg" }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    user: {
      additionalFields: {
        mustChangePassword: {
          type: "boolean",
          required: false,
          defaultValue: false,
          input: false,
        },
      },
    },
    session: {
      expiresIn: 30 * DAY,
      updateAge: DAY,
      // Desligado para que desativar, redefinir senha e mudar papel valham na
      // próxima ação do usuário (design A4).
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: true,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
      },
    },
    disabledPaths: DISABLED_PATHS,
    plugins: [
      admin({ bannedUserMessage: DEACTIVATED_ACCOUNT_MESSAGE }),
      // Deve ser o último plugin.
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
