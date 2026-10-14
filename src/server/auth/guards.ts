import "server-only";

import { getAuth } from "./index";

export type AuthErrorCode =
  "UNAUTHENTICATED" | "PASSWORD_CHANGE_REQUIRED" | "FORBIDDEN";

/** Falha de autorização. Páginas e actions traduzem o código (design A4). */
export class AuthError extends Error {
  constructor(readonly code: AuthErrorCode) {
    super(code);
    this.name = "AuthError";
  }
}

export type Session = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getAuth>["api"]["getSession"]>>
>;
export type SessionUser = Session["user"];

/** Sessão válida, mesmo com troca de senha pendente. Usado só pela troca de senha e pelo logout. */
export async function requireSession(headers: Headers): Promise<Session> {
  const session = await getAuth().api.getSession({ headers });
  if (!session || session.user.banned) throw new AuthError("UNAUTHENTICATED");
  return session;
}

/** Sessão válida e sem troca de senha pendente. Base de toda página e operação protegida. */
export async function requireUser(headers: Headers): Promise<Session> {
  const session = await requireSession(headers);
  if (session.user.mustChangePassword) {
    throw new AuthError("PASSWORD_CHANGE_REQUIRED");
  }
  return session;
}

export function isAdmin(user: SessionUser): boolean {
  return user.role === "admin";
}

/** Como requireUser, e com papel admin. */
export async function requireAdmin(headers: Headers): Promise<Session> {
  const session = await requireUser(headers);
  if (!isAdmin(session.user)) throw new AuthError("FORBIDDEN");
  return session;
}
