"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AuthError } from "@/server/auth/guards";
import { createSheet } from "@/server/sheets/service";

export type CreateSheetState = { error?: string };

export async function createSheetAction(
  _state: CreateSheetState,
  formData: FormData,
): Promise<CreateSheetState> {
  let result;
  try {
    result = await createSheet(await headers(), {
      name: String(formData.get("name") ?? ""),
    });
  } catch (error) {
    if (!(error instanceof AuthError)) throw error;
    redirect(
      error.code === "PASSWORD_CHANGE_REQUIRED" ? "/trocar-senha" : "/login",
    );
  }
  if (!result.ok) return { error: result.fieldErrors.name };
  redirect(`/fichas/${result.id}`);
}
