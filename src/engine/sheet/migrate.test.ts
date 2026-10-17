import { describe, expect, it } from "vitest";

import { createEffect } from "@/engine/effects/schema";
import { createSource } from "@/engine/sources/rules";

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

/** A magia sem o campo `prepared`, que o formato 6 trocou (design M3). */
function withoutPrepared(spell: Record<string, unknown>) {
  const copy = { ...spell };
  delete copy.prepared;
  return copy;
}

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
        trackers: [],
        armorType: "light",
        armorBase: 10,
        shieldBonus: 2,
        weaponCategory: "simple",
        actions: [],
      },
      {
        ...withoutPrepared(spell),
        effects: [],
        trackers: [],
        actions: [],
        active: false,
        preparation: "prepared",
        castingAbility: "sheet",
      },
      { ...trait, effects: [], trackers: [], actions: [] },
    ]);
  });

  it("leva o formato 4 ao atual com trackers vazios e espaços zerados", () => {
    const current = createSheetDocument("Thorin");
    const source: Record<string, unknown> = {
      ...createSource("feat", "Robusto", "f1"),
    };
    delete source.trackers;
    const formatFour: Record<string, unknown> = {
      ...current,
      schemaVersion: 4,
      sources: [source],
    };
    delete formatFour.spellSlots;
    delete formatFour.pactSlots;

    const migrated = migrateSheetDocument(formatFour);
    expect(migrated.sources[0]?.trackers).toEqual([]);
    expect(migrated.spellSlots).toEqual(current.spellSlots);
    expect(migrated.pactSlots).toEqual({ level: 1, max: 0, used: 0 });
  });

  it("leva o formato 5 ao 6 trocando prepared por preparation", () => {
    const current = createSheetDocument("Elara");
    const spell = (name: string, level: number, prepared: boolean) => {
      const source: Record<string, unknown> = {
        ...createSource("spell", name, name),
        level,
        prepared,
      };
      delete source.preparation;
      return source;
    };
    const feat = createSource("feat", "Robusto", "f1");

    const migrated = migrateSheetDocument({
      ...current,
      schemaVersion: 5,
      sources: [
        spell("Sono", 1, true),
        spell("Enfeitiçar Pessoa", 1, false),
        spell("Mãos Mágicas", 0, false),
        feat,
      ],
    });

    expect(
      migrated.sources.map((s) => (s.kind === "spell" ? s.preparation : null)),
    ).toEqual(["prepared", "none", "none", null]);
    expect(migrated.sources.some((s) => "prepared" in s)).toBe(false);
    expect(migrated.sources[3]).toEqual(feat);
  });

  it("leva o formato 6 ao 7 sem inspiração heroica", () => {
    const formatSix: Record<string, unknown> = {
      ...createSheetDocument("Thorin"),
      schemaVersion: 6,
    };
    delete formatSix.heroicInspiration;

    expect(migrateSheetDocument(formatSix).heroicInspiration).toBe(false);
  });

  it("leva o formato 7 ao 8 sem atributo de conjuração", () => {
    const spell: Record<string, unknown> = {
      ...createSource("spell", "Sono", "s1"),
    };
    delete spell.castingAbility;
    const formatSeven: Record<string, unknown> = {
      ...createSheetDocument("Ária"),
      schemaVersion: 7,
      sources: [spell, createSource("feat", "Robusto", "f1")],
    };
    delete formatSeven.spellcastingAbility;

    const migrated = migrateSheetDocument(formatSeven);
    expect(migrated.spellcastingAbility).toBe("none");
    expect(migrated.sources[0]).toMatchObject({ castingAbility: "sheet" });
    expect(migrated.sources[1]).toEqual(createSource("feat", "Robusto", "f1"));
  });

  it("leva o formato 8 ao 9 com as listas vazias e o valor dos efeitos", () => {
    const feat: Record<string, unknown> = {
      ...createSource("feat", "Robusto", "f1"),
    };
    delete feat.actions;
    const effect: Record<string, unknown> = {
      ...createEffect("e1"),
      target: "hitPointsMax",
      expression: "nivel * 2",
    };
    delete effect.value;
    const formatEight: Record<string, unknown> = {
      ...createSheetDocument("Thorin"),
      schemaVersion: 8,
      sources: [{ ...feat, effects: [effect] }],
    };
    delete formatEight.proficiencies;
    delete formatEight.defenses;
    delete formatEight.conditions;
    delete formatEight.exhaustion;

    const migrated = migrateSheetDocument(formatEight);
    const fresh = createSheetDocument("Thorin");
    expect(migrated.schemaVersion).toBe(SHEET_SCHEMA_VERSION);
    expect(migrated.proficiencies).toEqual(fresh.proficiencies);
    expect(migrated.defenses).toEqual(fresh.defenses);
    expect(migrated.conditions).toEqual([]);
    expect(migrated.exhaustion).toBe(0);
    expect(migrated.sources[0]?.effects[0]).toEqual({
      ...createEffect("e1"),
      target: "hitPointsMax",
      expression: "nivel * 2",
      value: "",
    });
  });

  it("leva o formato 9 ao 10 com as fontes sem ações e as armas simples", () => {
    const strip = (source: Record<string, unknown>) => {
      const copy = { ...source };
      delete copy.actions;
      delete copy.weaponCategory;
      return copy;
    };
    const axe = {
      ...createSource("item", "Machado Grande", "i1"),
      category: "weapon" as const,
      equipped: true,
    };
    const spell = { ...createSource("spell", "Sono", "s1"), level: 1 };
    const formatNine: Record<string, unknown> = {
      ...createSheetDocument("Thorin"),
      schemaVersion: 9,
      sources: [strip(axe), strip(spell)],
    };

    const migrated = migrateSheetDocument(formatNine);
    expect(migrated.schemaVersion).toBe(10);
    expect(migrated.sources).toEqual([axe, spell]);
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
