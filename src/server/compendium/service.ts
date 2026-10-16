import "server-only";

import { asc, count, eq, inArray, like, and, type SQL } from "drizzle-orm";

import { SHEET_SCHEMA_VERSION } from "@/engine/sheet/document";
import { SOURCE_KINDS, type SourceKind } from "@/engine/sources/kinds";
import { migrateSource } from "@/engine/sources/migrate";
import { createSource, withoutTableState } from "@/engine/sources/rules";
import {
  sourceNameSchema,
  sourceSchema,
  type Source,
} from "@/engine/sources/schema";
import { searchKey } from "@/engine/sources/search";
import { requireAdmin, requireUser } from "@/server/auth/guards";
import { getDb } from "@/server/db";
import { compendiumEntry } from "@/server/db/schema";

/*
 * Compêndio (spec compendium, design B5): todo usuário logado lê e busca; só
 * admins criam, salvam, excluem e enviam fontes. Tudo o que chega do cliente é
 * validado como fonte e gravado sem estado de mesa.
 */

export const MAX_COMPENDIUM_ENTRIES = 2000;
export const MAX_SEARCH_RESULTS = 50;

export type CompendiumEntry = { id: string; source: Source };

export type CreateEntryResult =
  { ok: true; id: string } | { ok: false; error: "invalid_name" | "limit" };

export type SaveEntryResult =
  { status: "saved" } | { status: "not_found" } | { status: "invalid" };

export type DeleteEntryResult = { status: "deleted" } | { status: "not_found" };

export type SendToCompendiumResult =
  { ok: true; id: string } | { ok: false; error: "invalid" | "limit" };

/** Escapa os curingas do LIKE (o escape padrão do Postgres é a barra). */
function likePattern(text: string): string {
  return `%${text.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

function isKind(value: string): value is SourceKind {
  return (SOURCE_KINDS as readonly string[]).includes(value);
}

function toEntry(row: {
  id: string;
  data: unknown;
  schemaVersion: number;
}): CompendiumEntry {
  return { id: row.id, source: migrateSource(row.data, row.schemaVersion) };
}

/** Colunas gravadas a partir de uma fonte já validada e limpa. */
function columnsOf(source: Source) {
  return {
    kind: source.kind,
    name: source.name,
    searchName: searchKey(source.name),
    schemaVersion: SHEET_SCHEMA_VERSION,
    data: source,
  };
}

async function hasRoom(): Promise<boolean> {
  const [row] = await getDb().select({ total: count() }).from(compendiumEntry);
  return (row?.total ?? 0) < MAX_COMPENDIUM_ENTRIES;
}

/** Busca por parte do nome, sem acentos nem maiúsculas, em ordem alfabética. */
export async function searchEntries(
  headers: Headers,
  input: { query: string; kinds?: readonly string[] },
): Promise<CompendiumEntry[]> {
  await requireUser(headers);
  const filters: SQL[] = [];
  const key = searchKey(input.query);
  if (key) filters.push(like(compendiumEntry.searchName, likePattern(key)));
  if (input.kinds && input.kinds.length > 0) {
    const kinds = input.kinds.filter(isKind);
    if (kinds.length === 0) return [];
    filters.push(inArray(compendiumEntry.kind, kinds));
  }
  const rows = await getDb()
    .select({
      id: compendiumEntry.id,
      data: compendiumEntry.data,
      schemaVersion: compendiumEntry.schemaVersion,
    })
    .from(compendiumEntry)
    .where(and(...filters))
    .orderBy(asc(compendiumEntry.name), asc(compendiumEntry.id))
    .limit(MAX_SEARCH_RESULTS);
  return rows.map(toEntry);
}

/** Entrada nova com os valores iniciais do tipo (design B6). */
export async function createEntry(
  headers: Headers,
  input: { kind: string; name: string },
): Promise<CreateEntryResult> {
  const { user } = await requireAdmin(headers);
  const name = sourceNameSchema.safeParse(input.name);
  if (!name.success || !isKind(input.kind)) {
    return { ok: false, error: "invalid_name" };
  }
  if (!(await hasRoom())) return { ok: false, error: "limit" };

  const id = crypto.randomUUID();
  const source = createSource(input.kind, name.data, id);
  await getDb()
    .insert(compendiumEntry)
    .values({ id, createdBy: user.id, ...columnsOf(source) });
  return { ok: true, id };
}

/** Substitui a fonte da entrada; o tipo e o id não mudam. */
export async function saveEntry(
  headers: Headers,
  id: string,
  input: unknown,
): Promise<SaveEntryResult> {
  await requireAdmin(headers);
  const parsed = sourceSchema.safeParse(input);
  if (!parsed.success) return { status: "invalid" };

  const db = getDb();
  const [existing] = await db
    .select({ kind: compendiumEntry.kind })
    .from(compendiumEntry)
    .where(eq(compendiumEntry.id, id));
  if (!existing) return { status: "not_found" };
  if (existing.kind !== parsed.data.kind) return { status: "invalid" };

  const source = { ...withoutTableState(parsed.data), id };
  await db
    .update(compendiumEntry)
    .set({ ...columnsOf(source), updatedAt: new Date() })
    .where(eq(compendiumEntry.id, id));
  return { status: "saved" };
}

export async function deleteEntry(
  headers: Headers,
  id: string,
): Promise<DeleteEntryResult> {
  await requireAdmin(headers);
  const [deleted] = await getDb()
    .delete(compendiumEntry)
    .where(eq(compendiumEntry.id, id))
    .returning({ id: compendiumEntry.id });
  return deleted ? { status: "deleted" } : { status: "not_found" };
}

/** Cria uma entrada nova a partir de uma fonte da ficha (spec, design B3). */
export async function sendToCompendium(
  headers: Headers,
  input: unknown,
): Promise<SendToCompendiumResult> {
  const { user } = await requireAdmin(headers);
  const parsed = sourceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (!(await hasRoom())) return { ok: false, error: "limit" };

  const id = crypto.randomUUID();
  const source = { ...withoutTableState(parsed.data), id };
  await getDb()
    .insert(compendiumEntry)
    .values({ id, createdBy: user.id, ...columnsOf(source) });
  return { ok: true, id };
}
