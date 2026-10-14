import { z } from "zod";

/**
 * Versão atual do formato da ficha (design C2/C3).
 *
 * Toda mudança no schema abaixo precisa incrementar esta constante e
 * acrescentar em migrate.ts uma migração da versão anterior, com teste.
 */
export const SHEET_SCHEMA_VERSION = 1;

/** Tamanho máximo do documento serializado, em bytes. */
export const SHEET_MAX_BYTES = 256 * 1024;

const shortText = z.string().trim().max(100, "Use no máximo 100 caracteres");

export const identitySchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, "O nome é obrigatório")
    .max(100, "Use no máximo 100 caracteres"),
  species: shortText,
  class: shortText,
  level: z
    .number("O nível vai de 1 a 20")
    .int("O nível vai de 1 a 20")
    .min(1, "O nível vai de 1 a 20")
    .max(20, "O nível vai de 1 a 20"),
  background: shortText,
});

export const sheetDocumentSchema = z.strictObject({
  schemaVersion: z.literal(SHEET_SCHEMA_VERSION),
  identity: identitySchema,
});

export type SheetIdentity = z.infer<typeof identitySchema>;
export type SheetDocument = z.infer<typeof sheetDocumentSchema>;

/** Ficha nova: nível 1, demais campos de identificação vazios. */
export function createSheetDocument(name: string): SheetDocument {
  return sheetDocumentSchema.parse({
    schemaVersion: SHEET_SCHEMA_VERSION,
    identity: { name, species: "", class: "", level: 1, background: "" },
  });
}

/** Tamanho do documento serializado em JSON, em bytes UTF-8. */
export function sheetDocumentBytes(document: unknown): number {
  return new TextEncoder().encode(JSON.stringify(document)).length;
}
