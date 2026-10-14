import "server-only";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import {
  AuthError,
  requireAdmin,
  requireSession,
  requireUser,
  type Session,
} from "./guards";

type Level = "session" | "user" | "admin";

const guards = {
  session: requireSession,
  user: requireUser,
  admin: requireAdmin,
} satisfies Record<Level, (headers: Headers) => Promise<Session>>;

/**
 * Guard para Server Components: traduz falhas de autorização em navegação.
 * Sem sessão vai para o login, troca pendente vai para a troca de senha e
 * não-admin recebe "não encontrado" (design A4).
 */
export async function getPageSession(level: Level): Promise<Session> {
  try {
    return await guards[level](await headers());
  } catch (error) {
    if (!(error instanceof AuthError)) throw error;
    switch (error.code) {
      case "UNAUTHENTICATED":
        redirect("/login");
      case "PASSWORD_CHANGE_REQUIRED":
        redirect("/trocar-senha");
      case "FORBIDDEN":
        notFound();
    }
  }
}
