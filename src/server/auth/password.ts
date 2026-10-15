import "server-only";

import { isAPIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { passwordSchema } from "@/lib/password";
import { getDb } from "@/server/db";
import { user } from "@/server/db/schema";

import { requireSession } from "./guards";
import { getAuth } from "./index";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual"),
    newPassword: passwordSchema,
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ["newPassword"],
    message: "A nova senha precisa ser diferente da atual",
  });

export type ChangePasswordInput = z.input<typeof changePasswordSchema>;

export type ChangePasswordResult =
  | { ok: true; responseHeaders: Headers }
  | {
      ok: false;
      fieldErrors: Partial<Record<keyof ChangePasswordInput, string>>;
    };

/**
 * Troca a senha do usuário logado, encerra as outras sessões e conclui a troca
 * obrigatória pendente (design A8). Aceita usuários com troca pendente.
 * `responseHeaders` traz o cookie da nova sessão; em server actions o plugin
 * nextCookies já o aplica.
 */
export async function changePassword(
  headers: Headers,
  input: ChangePasswordInput,
): Promise<ChangePasswordResult> {
  const session = await requireSession(headers);

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof ChangePasswordInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof ChangePasswordInput;
      fieldErrors[field] ??= issue.message;
    }
    return { ok: false, fieldErrors };
  }

  let responseHeaders: Headers;
  try {
    ({ headers: responseHeaders } = await getAuth().api.changePassword({
      headers,
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: true,
      },
      returnHeaders: true,
    }));
  } catch (error) {
    if (isAPIError(error) && error.body?.code === "INVALID_PASSWORD") {
      return {
        ok: false,
        fieldErrors: { currentPassword: "Senha atual incorreta" },
      };
    }
    throw error;
  }

  // Se isto falhar, a pendência continua e o usuário só precisa trocar de novo.
  await getDb()
    .update(user)
    .set({ mustChangePassword: false })
    .where(eq(user.id, session.user.id));

  return { ok: true, responseHeaders };
}
