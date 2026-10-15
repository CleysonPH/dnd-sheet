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

/**
 * Formato 1 -> 2: acrescenta os números da ficha (spec sheet-core-stats) com os
 * valores iniciais. Os valores ficam escritos aqui, e não vêm de
 * createSheetDocument, para que esta migração continue gerando o formato 2
 * mesmo quando a ficha nova mudar em formatos futuros (design S5).
 */
export const migrateV1ToV2: SheetMigration = (document) => ({
  ...document,
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  savingThrows: {
    str: false,
    dex: false,
    con: false,
    int: false,
    wis: false,
    cha: false,
  },
  skills: {
    acrobatics: "none",
    animalHandling: "none",
    arcana: "none",
    athletics: "none",
    performance: "none",
    deception: "none",
    stealth: "none",
    history: "none",
    intimidation: "none",
    insight: "none",
    investigation: "none",
    medicine: "none",
    nature: "none",
    perception: "none",
    persuasion: "none",
    sleightOfHand: "none",
    religion: "none",
    survival: "none",
  },
  hitPoints: { hitDie: 8, damage: 0, temp: 0, hitDiceSpent: 0 },
  deathSaves: { successes: 0, failures: 0 },
  speed: 9,
  overrides: {},
});

/** Formato 2 -> 3: a ficha ganha a lista de fontes, vazia (design F2). */
export const migrateV2ToV3: SheetMigration = (document) => ({
  ...document,
  sources: [],
});

/** Migrações reais do formato. */
export const SHEET_MIGRATIONS: readonly SheetMigration[] = [
  migrateV1ToV2,
  migrateV2ToV3,
];

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
