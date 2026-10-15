"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AuthError } from "@/server/auth/guards";
import {
  deleteSheet,
  saveSheet,
  type DeleteSheetResult,
  type SaveSheetResult,
} from "@/server/sheets/service";
import {
  disableShare,
  enableShare,
  regenerateShare,
  type ShareResult,
} from "@/server/sheets/share";

/** Sessão perdida no meio da edição: leva ao login ou à troca de senha. */
async function withAuth<T>(run: (headers: Headers) => Promise<T>): Promise<T> {
  try {
    return await run(await headers());
  } catch (error) {
    if (!(error instanceof AuthError)) throw error;
    redirect(
      error.code === "PASSWORD_CHANGE_REQUIRED" ? "/trocar-senha" : "/login",
    );
  }
}

export async function saveSheetAction(
  id: string,
  baseVersion: number,
  document: unknown,
): Promise<SaveSheetResult> {
  return withAuth((h) => saveSheet(h, id, { baseVersion, document }));
}

export type DeleteSheetState = { error?: string };

export async function deleteSheetAction(
  id: string,
  _state: DeleteSheetState,
  formData: FormData,
): Promise<DeleteSheetState> {
  const result: DeleteSheetResult = await withAuth((h) =>
    deleteSheet(h, id, {
      confirmName: String(formData.get("confirmName") ?? ""),
    }),
  );
  if (result.status === "confirmation_mismatch") {
    return { error: "O nome digitado não confere com o da ficha." };
  }
  // Excluída aqui ou já inexistente: em ambos os casos, de volta à lista.
  redirect("/");
}

/** Link de compartilhamento: gerar, trocar e desativar (design L5). */
export async function shareSheetAction(
  id: string,
  action: "enable" | "regenerate" | "disable",
): Promise<ShareResult> {
  const run = {
    enable: enableShare,
    regenerate: regenerateShare,
    disable: disableShare,
  }[action];
  return withAuth((h) => run(h, id));
}
