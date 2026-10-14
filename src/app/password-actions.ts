"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AuthError } from "@/server/auth/guards";
import { changePassword } from "@/server/auth/password";

export type PasswordFormState = {
  fieldErrors?: Partial<Record<"currentPassword" | "newPassword", string>>;
  success?: string;
};

/**
 * Troca a senha do usuário logado. Na troca obrigatória, leva à página inicial;
 * na voluntária, fica na página com uma confirmação. O cookie da nova sessão é
 * aplicado pelo plugin nextCookies.
 */
export async function changePasswordAction(
  mode: "required" | "voluntary",
  _state: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  let result;
  try {
    result = await changePassword(await headers(), {
      currentPassword: String(formData.get("currentPassword") ?? ""),
      newPassword: String(formData.get("newPassword") ?? ""),
    });
  } catch (error) {
    if (error instanceof AuthError) redirect("/login");
    throw error;
  }

  if (!result.ok) return { fieldErrors: result.fieldErrors };
  if (mode === "required") redirect("/");
  return { success: "Senha alterada. Suas outras sessões foram encerradas." };
}
