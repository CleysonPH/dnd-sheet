import {
  SHEET_SCHEMA_VERSION,
  sheetDocumentSchema,
  type SheetDocument,
} from "./document";

/**
 * Converte um documento da versão `n` para a versão `n + 1`.
 * `migrations[n - 1]` leva da versão n para n + 1.
 */
export type SheetMigration = (
  document: Record<string, unknown>,
) => Record<string, unknown>;

/** Migrações reais do formato. Vazia enquanto só existir o formato 1. */
export const SHEET_MIGRATIONS: readonly SheetMigration[] = [];

export class SheetFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SheetFormatError";
  }
}

type MigrateOptions<T> = {
  migrations?: readonly SheetMigration[];
  currentVersion?: number;
  /** Valida o documento já na versão atual. */
  parse?: (document: unknown) => T;
};

/**
 * Leva um documento gravado em qualquer versão anterior para o formato atual
 * (design C3). Lança SheetFormatError para documento sem versão, de versão
 * futura ou que não valida depois de migrado.
 */
export function migrateSheetDocument<T = SheetDocument>(
  raw: unknown,
  {
    migrations = SHEET_MIGRATIONS,
    currentVersion = SHEET_SCHEMA_VERSION,
    parse = (doc) => sheetDocumentSchema.parse(doc) as T,
  }: MigrateOptions<T> = {},
): T {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new SheetFormatError("Documento da ficha não é um objeto");
  }
  let document = raw as Record<string, unknown>;
  const version = document.schemaVersion;
  if (
    typeof version !== "number" ||
    !Number.isInteger(version) ||
    version < 1
  ) {
    throw new SheetFormatError("Documento da ficha sem schemaVersion válido");
  }
  if (version > currentVersion) {
    throw new SheetFormatError(
      `Ficha no formato ${version}, mais novo que o suportado (${currentVersion})`,
    );
  }

  for (let v = version; v < currentVersion; v++) {
    const migration = migrations[v - 1];
    if (!migration) {
      throw new SheetFormatError(
        `Falta a migração do formato ${v} para ${v + 1}`,
      );
    }
    document = { ...migration(document), schemaVersion: v + 1 };
  }

  try {
    return parse(document);
  } catch (error) {
    throw new SheetFormatError(
      `Ficha inválida no formato ${currentVersion}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
