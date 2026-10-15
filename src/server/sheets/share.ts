import "server-only";

import { randomBytes } from "node:crypto";

import { and, eq, isNull, or } from "drizzle-orm";

import type { SheetDocument } from "@/engine/sheet/document";
import { migrateSheetDocument } from "@/engine/sheet/migrate";
import { requireUser } from "@/server/auth/guards";
import { getDb } from "@/server/db";
import { sheet, user } from "@/server/db/schema";

import { ownedBy } from "./service";

/*
 * Link de compartilhamento (spec character-sheets, design L1/L2). As ações do
 * dono passam por requireUser e ownedBy; a leitura pública não usa sessão e
 * devolve só o documento, nunca o id da ficha nem o dono.
 */

export type ShareResult =
  { ok: true; token: string | null } | { ok: false; error: "NOT_FOUND" };

/** 18 bytes aleatórios: 24 caracteres base64url (144 bits). */
export function generateShareToken(): string {
  return randomBytes(18).toString("base64url");
}

const TOKEN_FORMAT = /^[A-Za-z0-9_-]{24}$/;

const notFound = { ok: false, error: "NOT_FOUND" } as const;

async function setToken(
  headers: Headers,
  id: string,
  token: string | null,
): Promise<ShareResult> {
  const { user: owner } = await requireUser(headers);
  // Só o token: não é uma edição da ficha, então versão e data não mudam.
  const [row] = await getDb()
    .update(sheet)
    .set({ shareToken: token })
    .where(ownedBy(owner.id, id))
    .returning({ shareToken: sheet.shareToken });
  return row ? { ok: true, token: row.shareToken } : notFound;
}

/** Devolve o link atual ou cria um, se a ficha ainda não tiver. */
export async function enableShare(
  headers: Headers,
  id: string,
): Promise<ShareResult> {
  const { user: owner } = await requireUser(headers);
  const [row] = await getDb()
    .select({ shareToken: sheet.shareToken })
    .from(sheet)
    .where(ownedBy(owner.id, id));
  if (!row) return notFound;
  if (row.shareToken) return { ok: true, token: row.shareToken };
  return setToken(headers, id, generateShareToken());
}

/** Troca o link: o código anterior para de funcionar na hora. */
export function regenerateShare(
  headers: Headers,
  id: string,
): Promise<ShareResult> {
  return setToken(headers, id, generateShareToken());
}

/** Desativa o link. */
export function disableShare(
  headers: Headers,
  id: string,
): Promise<ShareResult> {
  return setToken(headers, id, null);
}

/**
 * A ficha de um link ativo, sem sessão; null para código inexistente, fora do
 * formato, link desativado, ficha excluída ou dono desativado.
 */
export async function getSharedSheet(
  token: string,
): Promise<{ document: SheetDocument } | null> {
  if (!TOKEN_FORMAT.test(token)) return null;
  const [row] = await getDb()
    .select({ data: sheet.data })
    .from(sheet)
    .innerJoin(user, eq(user.id, sheet.ownerId))
    .where(
      and(
        eq(sheet.shareToken, token),
        or(isNull(user.banned), eq(user.banned, false)),
      ),
    );
  return row ? { document: migrateSheetDocument(row.data) } : null;
}
