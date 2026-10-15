import "server-only";

import { and, eq, like } from "drizzle-orm";

import { getDb } from "@/server/db";
import { verification } from "@/server/db/schema";

/**
 * Apaga os links de redefinição de senha pendentes da conta (design P4). O
 * Better Auth guarda cada link na tabela `verification` com
 * `identifier = "reset-password:<token>"` e `value = <userId>`.
 */
export async function revokePasswordResetLinks(userId: string): Promise<void> {
  await getDb()
    .delete(verification)
    .where(
      and(
        like(verification.identifier, "reset-password:%"),
        eq(verification.value, userId),
      ),
    );
}
