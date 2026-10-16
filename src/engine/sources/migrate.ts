import { SHEET_SCHEMA_VERSION } from "@/engine/sheet/document";

import { sourceSchema, type Source } from "./schema";

/*
 * Migrações de uma fonte solta, usadas pelo compêndio (design B2). A partir
 * do formato 9, toda mudança de formato que mexe nas fontes define aqui o
 * passo da versão de origem, e a migração da ficha daquela versão o aplica a
 * cada fonte.
 */

export type SourceMigration = (
  source: Record<string, unknown>,
) => Record<string, unknown>;

/** Passos por versão de origem: `SOURCE_MIGRATIONS[n]` leva de n para n + 1. */
export const SOURCE_MIGRATIONS: Readonly<Record<number, SourceMigration>> = {};

/** Primeira versão em que há fontes soltas (o compêndio nasce no formato 9). */
export const FIRST_SOURCE_VERSION = 9;

export class SourceFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SourceFormatError";
  }
}

type MigrateOptions = {
  migrations?: Readonly<Record<number, SourceMigration>>;
  currentVersion?: number;
};

/**
 * Leva uma fonte gravada na versão `version` ao formato atual e a valida.
 * Lança SourceFormatError para versão fora do intervalo ou fonte inválida.
 */
export function migrateSource(
  data: unknown,
  version: number,
  {
    migrations = SOURCE_MIGRATIONS,
    currentVersion = SHEET_SCHEMA_VERSION,
  }: MigrateOptions = {},
): Source {
  if (
    !Number.isInteger(version) ||
    version < FIRST_SOURCE_VERSION ||
    version > currentVersion
  ) {
    throw new SourceFormatError(`Fonte no formato ${version}, não suportado`);
  }
  if (typeof data !== "object" || data === null) {
    throw new SourceFormatError("Fonte sem conteúdo");
  }
  let source = data as Record<string, unknown>;
  for (let v = version; v < currentVersion; v++) {
    const step = migrations[v];
    if (step) source = step(source);
  }
  const parsed = sourceSchema.safeParse(source);
  if (!parsed.success) {
    throw new SourceFormatError(
      `Fonte inválida: ${parsed.error.issues[0]?.message ?? "formato"}`,
    );
  }
  return parsed.data;
}
