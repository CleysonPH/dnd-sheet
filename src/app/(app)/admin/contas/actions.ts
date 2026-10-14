"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import {
  createAccount,
  deactivateAccount,
  reactivateAccount,
  resetAccountPassword,
  setAccountRole,
  type AccountError,
} from "@/server/accounts/service";
import { AuthError } from "@/server/auth/guards";

export type CreateAccountState = {
  fieldErrors?: Partial<Record<"name" | "email", string>>;
  created?: { name: string; email: string; tempPassword: string };
};

export type RowActionState = {
  error?: string;
  tempPassword?: string;
};

const ERROR_MESSAGES: Record<AccountError, string> = {
  SELF_ACTION: "Você não pode alterar o acesso da própria conta.",
  NOT_FOUND: "Conta não encontrada.",
  EMAIL_IN_USE: "Este e-mail já está em uso.",
  INVALID_INPUT: "Dados inválidos.",
};

/** Traduz falhas de autorização em navegação, como nas páginas (design A4). */
async function withAuth<T>(run: (headers: Headers) => Promise<T>): Promise<T> {
  try {
    return await run(await headers());
  } catch (error) {
    if (!(error instanceof AuthError)) throw error;
    if (error.code === "FORBIDDEN") notFound();
    redirect(error.code === "UNAUTHENTICATED" ? "/login" : "/trocar-senha");
  }
}

export async function createAccountAction(
  _state: CreateAccountState,
  formData: FormData,
): Promise<CreateAccountState> {
  const result = await withAuth((h) =>
    createAccount(h, {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
    }),
  );
  if (!result.ok) return { fieldErrors: result.fieldErrors };
  refresh();
  return {
    created: {
      name: result.account.name,
      email: result.account.email,
      tempPassword: result.tempPassword,
    },
  };
}

type RowAction = "deactivate" | "reactivate" | "reset" | "promote" | "demote";

export async function accountRowAction(
  userId: string,
  _state: RowActionState,
  formData: FormData,
): Promise<RowActionState> {
  const action = formData.get("action") as RowAction;

  if (action === "reset") {
    const result = await withAuth((h) => resetAccountPassword(h, userId));
    if (!result.ok) return { error: ERROR_MESSAGES[result.error] };
    refresh();
    return { tempPassword: result.tempPassword };
  }

  const run = {
    deactivate: deactivateAccount,
    reactivate: reactivateAccount,
    promote: (h: Headers, id: string) => setAccountRole(h, id, "admin"),
    demote: (h: Headers, id: string) => setAccountRole(h, id, "user"),
  }[action];
  if (!run) return { error: "Ação desconhecida." };

  const result = await withAuth((h) => run(h, userId));
  if (!result.ok) return { error: ERROR_MESSAGES[result.error] };
  refresh();
  return {};
}
