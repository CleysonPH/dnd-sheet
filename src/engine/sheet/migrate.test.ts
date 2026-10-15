import { describe, expect, it } from "vitest";

import { SHEET_SCHEMA_VERSION, createSheetDocument } from "./document";
import {
  SHEET_MIGRATIONS,
  SheetFormatError,
  migrateSheetDocument,
  type SheetMigration,
} from "./migrate";

// Migrações sintéticas para exercitar o mecanismo antes de existir uma real.
const v1ToV2: SheetMigration = ({ name, ...rest }) => ({
  ...rest,
  identity: { name },
});
const v2ToV3: SheetMigration = ({ identity, ...rest }) => ({
  ...rest,
  identity: { ...(identity as object), level: 1 },
});
const synthetic = {
  migrations: [v1ToV2, v2ToV3],
  currentVersion: 3,
  parse: (doc: unknown) => doc,
};

describe("migrateSheetDocument", () => {
  it("as migrações reais cobrem todas as versões anteriores à atual", () => {
    expect(SHEET_MIGRATIONS).toHaveLength(SHEET_SCHEMA_VERSION - 1);
  });

  it("devolve o documento atual sem mudanças", () => {
    const document = createSheetDocument("Thorin");
    expect(migrateSheetDocument(structuredClone(document))).toEqual(document);
  });

  it("aplica as migrações em cadeia e atualiza a versão", () => {
    expect(
      migrateSheetDocument({ schemaVersion: 1, name: "Thorin" }, synthetic),
    ).toEqual({ schemaVersion: 3, identity: { name: "Thorin", level: 1 } });
  });

  it("começa da versão em que o documento está", () => {
    expect(
      migrateSheetDocument(
        { schemaVersion: 2, identity: { name: "Grog" } },
        synthetic,
      ),
    ).toEqual({ schemaVersion: 3, identity: { name: "Grog", level: 1 } });
  });

  it("recusa versão mais nova que a suportada", () => {
    expect(() => migrateSheetDocument({ schemaVersion: 4 }, synthetic)).toThrow(
      SheetFormatError,
    );
  });

  it("recusa documento sem schemaVersion ou que não é objeto", () => {
    for (const raw of [{ identity: {} }, null, "x", [], { schemaVersion: 0 }]) {
      expect(() => migrateSheetDocument(raw)).toThrow(SheetFormatError);
    }
  });

  it("leva uma ficha do formato 1 ao atual, mantendo a identificação", () => {
    const identity = {
      name: "Thorin",
      species: "Anão",
      class: "Bárbaro",
      level: 5,
      background: "Soldado",
    };
    expect(migrateSheetDocument({ schemaVersion: 1, identity })).toEqual({
      ...createSheetDocument("Thorin"),
      identity,
    });
  });

  it("leva uma ficha do formato 2 ao atual com a lista de fontes vazia", () => {
    const { sources, ...formatTwo } = createSheetDocument("Thorin");
    expect(sources).toEqual([]);
    expect(
      migrateSheetDocument({
        ...formatTwo,
        schemaVersion: 2,
        abilities: { ...formatTwo.abilities, str: 16 },
      }),
    ).toEqual({
      ...createSheetDocument("Thorin"),
      abilities: { ...formatTwo.abilities, str: 16 },
    });
  });

  it("leva fontes do formato 3 ao atual, sem efeitos", () => {
    const current = createSheetDocument("Thorin");
    const item = {
      id: "i1",
      kind: "item",
      name: "Cota de Malha",
      description: "",
      category: "armor",
      quantity: 1,
      weight: 25,
      price: "",
      equipped: true,
      requiresAttunement: false,
      attuned: false,
    };
    const spell = {
      id: "s1",
      kind: "spell",
      name: "Sono",
      description: "",
      level: 1,
      school: "enchantment",
      spellClass: "",
      castingTime: "",
      range: "",
      duration: "",
      verbal: true,
      somatic: true,
      material: false,
      materialText: "",
      concentration: true,
      ritual: false,
      prepared: true,
    };
    const trait = {
      id: "t1",
      kind: "trait",
      name: "Fúria",
      description: "",
      origin: "class",
      from: "Bárbaro",
    };
    expect(
      migrateSheetDocument({
        ...current,
        schemaVersion: 3,
        sources: [item, spell, trait],
      }).sources,
    ).toEqual([
      {
        ...item,
        effects: [],
        armorType: "light",
        armorBase: 10,
        shieldBonus: 2,
      },
      { ...spell, effects: [], active: false },
      { ...trait, effects: [] },
    ]);
  });

  it("recusa documento que não valida depois de migrado", () => {
    expect(() =>
      migrateSheetDocument({ schemaVersion: 1, identity: { name: "" } }),
    ).toThrow(SheetFormatError);
  });

  it("falha se faltar uma migração na cadeia", () => {
    expect(() =>
      migrateSheetDocument(
        { schemaVersion: 1 },
        { ...synthetic, migrations: [v1ToV2] },
      ),
    ).toThrow(/Falta a migração do formato 2 para 3/);
  });
});
