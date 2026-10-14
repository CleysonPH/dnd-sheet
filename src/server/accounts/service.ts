import "server-only";

import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { getAuth } from "@/server/auth";
import { requireAdmin } from "@/server/auth/guards";
import { getDb } from "@/server/db";
import { user } from "@/server/db/schema";

import { generateTempPassword } from "./temp-password";

/*
 * Administração de contas (spec account-management, design A3). Os endpoints
 * HTTP do plugin admin estão desligados: tudo passa por aqui, onde ficam as
 * regras. Os headers do admin são repassados ao auth.api, que também confere
 * a permissão.
 */

export type Role = "user" | "admin";

export type AccountSummary = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: Date;
};

export type AccountError =
  "SELF_ACTION" | "NOT_FOUND" | "EMAIL_IN_USE" | "INVALID_INPUT";

export type AccountResult<T = object> =
  | ({ ok: true } & T)
  | {
      ok: false;
      error: AccountError;
      fieldErrors?: Partial<Record<"name" | "email", string>>;
    };

export const createAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome")
    .max(100, "O nome pode ter no máximo 100 caracteres"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("E-mail em formato inválido")),
});

export type CreateAccountInput = z.input<typeof createAccountSchema>;

export async function listAccounts(
  headers: Headers,
): Promise<AccountSummary[]> {
  await requireAdmin(headers);
  const rows = await getDb()
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(asc(user.createdAt));
  return rows.map(({ banned, role, ...row }) => ({
    ...row,
    role: role === "admin" ? "admin" : "user",
    active: !banned,
  }));
}

/** Cria uma conta comum com senha provisória e troca obrigatória pendente. */
export async function createAccount(
  headers: Headers,
  input: CreateAccountInput,
): Promise<AccountResult<{ account: AccountSummary; tempPassword: string }>> {
  await requireAdmin(headers);

  const parsed = createAccountSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<"name" | "email", string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as "name" | "email";
      fieldErrors[field] ??= issue.message;
    }
    return { ok: false, error: "INVALID_INPUT", fieldErrors };
  }

  const { name, email } = parsed.data;
  const [existing] = await getDb()
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email));
  if (existing) {
    return {
      ok: false,
      error: "EMAIL_IN_USE",
      fieldErrors: { email: "Este e-mail já está em uso" },
    };
  }

  const tempPassword = generateTempPassword();
  const { user: created } = await getAuth().api.createUser({
    headers,
    body: {
      name,
      email,
      password: tempPassword,
      role: "user",
      data: { mustChangePassword: true },
    },
  });

  return {
    ok: true,
    tempPassword,
    account: {
      id: created.id,
      name: created.name,
      email: created.email,
      role: "user",
      active: true,
      createdAt: created.createdAt,
    },
  };
}

/** Garante que o alvo existe e não é o próprio admin. */
async function resolveTarget(
  headers: Headers,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: AccountError }> {
  const { user: admin } = await requireAdmin(headers);
  if (admin.id === userId) return { ok: false, error: "SELF_ACTION" };
  const [target] = await getDb()
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, userId));
  return target ? { ok: true } : { ok: false, error: "NOT_FOUND" };
}

/** Bloqueia o login e encerra todas as sessões da conta. Os dados ficam. */
export async function deactivateAccount(
  headers: Headers,
  userId: string,
): Promise<AccountResult> {
  const target = await resolveTarget(headers, userId);
  if (!target.ok) return target;
  await getAuth().api.banUser({ headers, body: { userId } });
  return { ok: true };
}

export async function reactivateAccount(
  headers: Headers,
  userId: string,
): Promise<AccountResult> {
  const target = await resolveTarget(headers, userId);
  if (!target.ok) return target;
  await getAuth().api.unbanUser({ headers, body: { userId } });
  return { ok: true };
}

/** Nova senha provisória, sessões encerradas e troca obrigatória pendente. */
export async function resetAccountPassword(
  headers: Headers,
  userId: string,
): Promise<AccountResult<{ tempPassword: string }>> {
  const target = await resolveTarget(headers, userId);
  if (!target.ok) return target;

  const tempPassword = generateTempPassword();
  const auth = getAuth();
  await auth.api.setUserPassword({
    headers,
    body: { userId, newPassword: tempPassword },
  });
  await getDb()
    .update(user)
    .set({ mustChangePassword: true })
    .where(eq(user.id, userId));
  await auth.api.revokeUserSessions({ headers, body: { userId } });
  return { ok: true, tempPassword };
}

export async function setAccountRole(
  headers: Headers,
  userId: string,
  role: Role,
): Promise<AccountResult> {
  const target = await resolveTarget(headers, userId);
  if (!target.ok) return target;
  await getAuth().api.setRole({ headers, body: { userId, role } });
  return { ok: true };
}
