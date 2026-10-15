import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { waitUntil } from "@vercel/functions";
import { eq } from "drizzle-orm";

import type { Database } from "@/server/db";
import { user } from "@/server/db/schema";
import {
  RESET_LINK_TTL_SECONDS,
  passwordResetUrl,
} from "@/server/mail/password-reset";

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

/** Dados do e-mail de redefinição, enviados pelo `sendPasswordResetMail`. */
export type PasswordResetMailInput = { to: string; name: string; url: string };

/** Monta a instância do Better Auth. Sem `server-only`, para a CLI conseguir carregá-la. */
export function createAuth(options: {
  db: Database;
  secret: string;
  baseURL: string;
  /** Envia o e-mail de redefinição. Injetado para a CLI não depender do SMTP. */
  sendPasswordResetMail: (input: PasswordResetMailInput) => Promise<void>;
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
      resetPasswordTokenExpiresIn: RESET_LINK_TTL_SECONDS,
      revokeSessionsOnPasswordReset: true,
      // Sem await (design P3): a resposta leva o mesmo tempo exista a conta ou
      // não, e uma falha de SMTP só vai para o log. Conta desativada não
      // recebe o link (design P4). Na Vercel, waitUntil mantém a função viva
      // até o envio terminar; fora dela, a promessa segue sozinha (design Y2).
      sendResetPassword: async ({ user: target, token }) => {
        if ((target as { banned?: boolean | null }).banned) return;
        waitUntil(
          options
            .sendPasswordResetMail({
              to: target.email,
              name: target.name,
              url: passwordResetUrl(options.baseURL, token),
            })
            .catch((error: unknown) => {
              console.error("Falha ao enviar o e-mail de redefinição:", error);
            }),
        );
      },
      // A pessoa acabou de escolher a própria senha (design P5).
      onPasswordReset: async ({ user: target }) => {
        await options.db
          .update(user)
          .set({ mustChangePassword: false })
          .where(eq(user.id, target.id));
      },
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
      // No banco, para valer entre instâncias serverless (design Y2).
      storage: "database",
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/request-password-reset": { window: 60, max: 3 },
      },
    },
    disabledPaths: DISABLED_PATHS,
    advanced: {
      // A Vercel sobrescreve x-forwarded-for com o IP real do cliente.
      ipAddress: { ipAddressHeaders: ["x-forwarded-for"] },
    },
    plugins: [
      admin({ bannedUserMessage: DEACTIVATED_ACCOUNT_MESSAGE }),
      // Deve ser o último plugin.
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
