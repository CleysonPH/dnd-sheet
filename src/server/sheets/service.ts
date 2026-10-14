import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import {
  SHEET_MAX_BYTES,
  createSheetDocument,
  identitySchema,
  sheetDocumentBytes,
  sheetDocumentSchema,
  type SheetDocument,
} from "@/engine/sheet/document";
import { migrateSheetDocument } from "@/engine/sheet/migrate";
import { requireUser } from "@/server/auth/guards";
import { getDb } from "@/server/db";
import { sheet } from "@/server/db/schema";

/*
 * Fichas de personagem (spec character-sheets, design C4). Toda consulta filtra
 * pelo dono da sessão: ficha de outro usuário e ficha inexistente têm o mesmo
 * resultado, sem exceção para admins.
 */

export type SheetSummary = {
  id: string;
  name: string;
  species: string;
  class: string;
  level: number | null;
  updatedAt: Date;
};

export type LoadedSheet = {
  id: string;
  version: number;
  document: SheetDocument;
};

export type CreateSheetResult =
  { ok: true; id: string } | { ok: false; fieldErrors: { name: string } };

export type SaveSheetResult =
  | { status: "saved"; version: number }
  | { status: "conflict" }
  | { status: "not_found" }
  | { status: "invalid"; reason: "too_large" | "schema" };

export type DeleteSheetResult =
  | { status: "deleted" }
  | { status: "not_found" }
  | { status: "confirmation_mismatch" };

function ownedBy(ownerId: string, id: string) {
  return and(eq(sheet.id, id), eq(sheet.ownerId, ownerId));
}

export async function listSheets(headers: Headers): Promise<SheetSummary[]> {
  const { user } = await requireUser(headers);
  const rows = await getDb()
    .select({
      id: sheet.id,
      name: sheet.name,
      updatedAt: sheet.updatedAt,
      // Só o trecho de identificação, não o documento inteiro (design C1).
      identity: sql<Record<
        string,
        unknown
      > | null>`${sheet.data} -> 'identity'`,
    })
    .from(sheet)
    .where(eq(sheet.ownerId, user.id))
    .orderBy(desc(sheet.updatedAt));

  return rows.map(({ identity, ...row }) => ({
    ...row,
    species: typeof identity?.species === "string" ? identity.species : "",
    class: typeof identity?.class === "string" ? identity.class : "",
    level: typeof identity?.level === "number" ? identity.level : null,
  }));
}

export async function createSheet(
  headers: Headers,
  input: { name: string },
): Promise<CreateSheetResult> {
  const { user } = await requireUser(headers);
  const name = identitySchema.shape.name.safeParse(input.name);
  if (!name.success) {
    return {
      ok: false,
      fieldErrors: { name: name.error.issues[0]?.message ?? "Nome inválido" },
    };
  }

  const document = createSheetDocument(name.data);
  const [created] = await getDb()
    .insert(sheet)
    .values({
      ownerId: user.id,
      name: document.identity.name,
      data: document,
    })
    .returning({ id: sheet.id });
  return { ok: true, id: created!.id };
}

/** A ficha do dono, já convertida para o formato atual; `null` se não for dele. */
export async function getSheet(
  headers: Headers,
  id: string,
): Promise<LoadedSheet | null> {
  const { user } = await requireUser(headers);
  const [row] = await getDb()
    .select({ id: sheet.id, version: sheet.version, data: sheet.data })
    .from(sheet)
    .where(ownedBy(user.id, id));
  if (!row) return null;
  return {
    id: row.id,
    version: row.version,
    document: migrateSheetDocument(row.data),
  };
}

/**
 * Grava o documento só se a ficha ainda estiver em `baseVersion`. A checagem e
 * a escrita são um único UPDATE, sem janela entre ler e gravar.
 */
export async function saveSheet(
  headers: Headers,
  id: string,
  input: { baseVersion: number; document: unknown },
): Promise<SaveSheetResult> {
  const { user } = await requireUser(headers);

  if (sheetDocumentBytes(input.document) > SHEET_MAX_BYTES) {
    return { status: "invalid", reason: "too_large" };
  }
  const parsed = sheetDocumentSchema.safeParse(input.document);
  if (!parsed.success || !Number.isInteger(input.baseVersion)) {
    return { status: "invalid", reason: "schema" };
  }

  const db = getDb();
  const [saved] = await db
    .update(sheet)
    .set({
      data: parsed.data,
      name: parsed.data.identity.name,
      version: sql`${sheet.version} + 1`,
      updatedAt: new Date(),
    })
    .where(and(ownedBy(user.id, id), eq(sheet.version, input.baseVersion)))
    .returning({ version: sheet.version });
  if (saved) return { status: "saved", version: saved.version };

  const [existing] = await db
    .select({ id: sheet.id })
    .from(sheet)
    .where(ownedBy(user.id, id));
  return existing ? { status: "conflict" } : { status: "not_found" };
}

/** Exclusão definitiva, só se `confirmName` for exatamente o nome guardado. */
export async function deleteSheet(
  headers: Headers,
  id: string,
  input: { confirmName: string },
): Promise<DeleteSheetResult> {
  const { user } = await requireUser(headers);
  const db = getDb();
  const [deleted] = await db
    .delete(sheet)
    .where(and(ownedBy(user.id, id), eq(sheet.name, input.confirmName)))
    .returning({ id: sheet.id });
  if (deleted) return { status: "deleted" };

  const [existing] = await db
    .select({ id: sheet.id })
    .from(sheet)
    .where(ownedBy(user.id, id));
  return existing
    ? { status: "confirmation_mismatch" }
    : { status: "not_found" };
}
