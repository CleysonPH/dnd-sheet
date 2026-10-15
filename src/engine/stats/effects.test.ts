import { describe, expect, it } from "vitest";

import { createEffect, type Effect } from "@/engine/effects/schema";
import type { EffectTarget } from "@/engine/effects/targets";
import {
  createSheetDocument,
  type SheetDocument,
} from "@/engine/sheet/document";
import { createSource } from "@/engine/sources/rules";
import type { Item, Source, Spell } from "@/engine/sources/schema";

import { deriveStats } from "./derive";

let nextId = 0;
const id = () => `id${nextId++}`;

function effect(
  target: EffectTarget,
  op: Effect["op"],
  expression: string,
  extra: Partial<Effect> = {},
): Effect {
  return { ...createEffect(id()), target, op, expression, ...extra };
}

function trait(name: string, effects: Effect[]): Source {
  return { ...createSource("trait", name, id()), effects };
}

function item(
  name: string,
  patch: Partial<Item>,
  effects: Effect[] = [],
): Item {
  return {
    ...createSource("item", name, id()),
    equipped: true,
    ...patch,
    effects,
  };
}

function spell(name: string, patch: Partial<Spell>, effects: Effect[]): Spell {
  return { ...createSource("spell", name, id()), level: 1, ...patch, effects };
}

type Patch = {
  level?: number;
  abilities?: Partial<SheetDocument["abilities"]>;
  sources?: Source[];
  overrides?: SheetDocument["overrides"];
};

function character(
  base: Required<Omit<Patch, "sources" | "overrides">> & {
    savingThrows?: Partial<SheetDocument["savingThrows"]>;
    skills?: Partial<SheetDocument["skills"]>;
    hitDie?: 6 | 8 | 10 | 12;
  },
) {
  return (patch: Patch = {}): SheetDocument => {
    const doc = createSheetDocument("X");
    return {
      ...doc,
      identity: { ...doc.identity, level: patch.level ?? base.level },
      abilities: { ...doc.abilities, ...base.abilities, ...patch.abilities },
      savingThrows: { ...doc.savingThrows, ...base.savingThrows },
      skills: { ...doc.skills, ...base.skills },
      hitPoints: { ...doc.hitPoints, hitDie: base.hitDie ?? 8 },
      sources: patch.sources ?? [],
      overrides: patch.overrides ?? {},
    };
  };
}

/** Thorin, Bárbaro nível 5: FOR 16, DES 14, CON 16; PB +3; 55 PV. */
const thorin = character({
  level: 5,
  abilities: { str: 16, dex: 14, con: 16, int: 8, wis: 12, cha: 10 },
  savingThrows: { str: true, con: true },
  skills: { athletics: "proficient", perception: "proficient" },
  hitDie: 12,
});

/** Elara, Ladina nível 3: DES 17, proficiente em Furtividade. */
const elara = character({
  level: 3,
  abilities: { str: 8, dex: 17, con: 14, int: 13, wis: 12, cha: 14 },
  skills: { stealth: "proficient", perception: "proficient" },
});

/** Kai, Monge: DES 16, SAB 15. */
const kai = character({
  level: 3,
  abilities: { dex: 16, wis: 15 },
});

/** Bardo nível 5, CAR 10, proficiente só em Atuação. */
const bard = character({
  level: 5,
  abilities: {},
  skills: { performance: "proficient" },
});

const unarmoredBarbarian = () =>
  trait("Defesa sem Armadura", [
    effect("armorClass", "altBase", "10 + des.mod + con.mod", {
      noArmor: true,
    }),
  ]);
const shield = () => item("Escudo", { category: "shield", shieldBonus: 2 });
const ringOfProtection = (patch: Partial<Item> = {}) =>
  item(
    "Anel de Proteção",
    { requiresAttunement: true, attuned: true, ...patch },
    [effect("armorClass", "add", "1"), effect("save.all", "add", "1")],
  );

function value(
  doc: SheetDocument,
  key: keyof ReturnType<typeof deriveStats>["values"],
) {
  return deriveStats(doc).values[key].value;
}

describe("efeitos em atributos", () => {
  const gauntlets = (patch: Partial<Item> = {}) =>
    item(
      "Manoplas de Força do Ogro",
      { requiresAttunement: true, attuned: true, ...patch },
      [effect("ability.str", "set", "19")],
    );

  it("Manoplas: FOR 16 vira 19, mod +4, Atletismo +7", () => {
    const stats = deriveStats(thorin({ sources: [gauntlets()] }));
    expect(stats.abilityScores.str).toMatchObject({ value: 19, base: 16 });
    expect(stats.values["mod.str"].value).toBe(4);
    expect(stats.values["skill.athletics"].value).toBe(7);
  });

  it("Manoplas não sintonizadas não valem", () => {
    const doc = thorin({ sources: [gauntlets({ attuned: false })] });
    expect(deriveStats(doc).abilityScores.str.value).toBe(16);
  });

  it("FOR 20 continua 20 com as Manoplas", () => {
    const doc = thorin({ abilities: { str: 20 }, sources: [gauntlets()] });
    expect(deriveStats(doc).abilityScores.str.value).toBe(20);
  });

  it("um atributo pode depender de outro, sem ciclo", () => {
    const doc = thorin({
      sources: [trait("Bênção", [effect("ability.str", "set", "des + 5")])],
    });
    expect(deriveStats(doc).abilityScores.str.value).toBe(19);
  });

  it("ciclo FOR/DES: os dois efeitos são ignorados e sinalizados", () => {
    const a = item("A", {}, [effect("ability.str", "set", "des.mod + 10")]);
    const b = item("B", {}, [effect("ability.dex", "set", "for.mod + 10")]);
    const stats = deriveStats(thorin({ sources: [a, b] }));
    expect(stats.abilityScores.str.value).toBe(16);
    expect(stats.abilityScores.dex.value).toBe(14);
    expect(stats.issues).toHaveLength(2);
    expect(stats.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceId: a.id, reason: "cycle" }),
        expect.objectContaining({ sourceId: b.id, reason: "cycle" }),
      ]),
    );
  });

  it("atributo que depende de si mesmo é ignorado", () => {
    const self = trait("Laço", [effect("ability.str", "add", "for.mod")]);
    const stats = deriveStats(thorin({ sources: [self] }));
    expect(stats.abilityScores.str.value).toBe(16);
    expect(stats.issues).toEqual([
      {
        sourceId: self.id,
        effectId: self.effects[0]!.id,
        reason: "cycle",
        message: "Dependência circular",
      },
    ]);
  });

  it("conj.mod com conjuração INT num efeito em INT é ciclo", () => {
    const loop = trait("Laço", [effect("ability.int", "add", "conj.mod")]);
    const doc = {
      ...thorin({ sources: [loop] }),
      spellcastingAbility: "int" as const,
    };
    const stats = deriveStats(doc);
    expect(stats.abilityScores.int.value).toBe(doc.abilities.int);
    expect(stats.issues).toEqual([
      expect.objectContaining({ sourceId: loop.id, reason: "cycle" }),
    ]);
  });

  it("divisão por zero ignora o efeito e registra o erro", () => {
    const bad = trait("Erro", [
      effect("hitPointsMax", "add", "10 / (des.mod - 2)"),
    ]);
    const stats = deriveStats(thorin({ sources: [bad] }));
    expect(stats.values.hitPointsMax.value).toBe(55);
    expect(stats.issues[0]).toMatchObject({
      reason: "error",
      message: "Divisão por zero",
    });
  });
});

describe("somar e proficiência", () => {
  it("Alerta: iniciativa +2 vira +5", () => {
    const alert = trait("Alerta", [effect("initiative", "add", "pb")]);
    expect(value(thorin({ sources: [alert] }), "initiative")).toBe(5);
  });

  it("Robusto: 55 PV viram 65", () => {
    const tough = trait("Robusto", [
      effect("hitPointsMax", "add", "2 * nivel"),
    ]);
    expect(value(thorin({ sources: [tough] }), "hitPointsMax")).toBe(65);
  });

  it("Anel de Proteção soma 1 em todas as salvaguardas", () => {
    const doc = thorin({ sources: [ringOfProtection()] });
    expect(value(doc, "save.str")).toBe(7);
    expect(value(doc, "save.dex")).toBe(3);
    expect(value(doc, "save.cha")).toBe(1);
  });

  it("item desequipado não soma", () => {
    const doc = thorin({ sources: [ringOfProtection({ equipped: false })] });
    expect(value(doc, "save.str")).toBe(6);
  });

  it("deslocamento: somar 3 em 9 m dá 12 m; definir 12 também", () => {
    const fast = trait("Ligeiro", [effect("speed", "add", "3")]);
    expect(value(thorin({ sources: [fast] }), "speed")).toBe(12);
    const set = trait("Botas", [effect("speed", "set", "12")]);
    expect(value(thorin({ sources: [set] }), "speed")).toBe(12);
  });

  it("Pau para Toda Obra: +1 nas perícias sem proficiência, Atuação fica +3", () => {
    const jack = trait("Pau para Toda Obra", [
      effect("skill.all", "proficiency", "", { proficiency: "half" }),
    ]);
    const doc = bard({ sources: [jack] });
    expect(value(doc, "skill.athletics")).toBe(1);
    expect(value(doc, "skill.performance")).toBe(3);
    expect(value(doc, "save.str")).toBe(0);
  });

  it("expertise por efeito: Furtividade de Elara +7", () => {
    const expert = trait("Especialista", [
      effect("skill.stealth", "proficiency", "", { proficiency: "expertise" }),
    ]);
    expect(value(elara({ sources: [expert] }), "skill.stealth")).toBe(7);
  });
});

describe("CA", () => {
  it("sem armadura nem efeitos: 10 + DES = 12", () => {
    expect(value(thorin(), "armorClass")).toBe(12);
  });

  it("Defesa sem Armadura do Bárbaro: 15, e 17 com escudo", () => {
    expect(
      value(thorin({ sources: [unarmoredBarbarian()] }), "armorClass"),
    ).toBe(15);
    expect(
      value(
        thorin({ sources: [unarmoredBarbarian(), shield()] }),
        "armorClass",
      ),
    ).toBe(17);
  });

  it("Cota de Malha pesada 16 anula a Defesa sem Armadura", () => {
    const chain = item("Cota de Malha", {
      category: "armor",
      armorType: "heavy",
      armorBase: 16,
    });
    expect(
      value(thorin({ sources: [unarmoredBarbarian(), chain] }), "armorClass"),
    ).toBe(16);
  });

  it("armadura leve soma a DES; média, até +2", () => {
    const leather = item("Couro Batido", {
      category: "armor",
      armorType: "light",
      armorBase: 12,
    });
    const scale = item("Cota de Escamas", {
      category: "armor",
      armorType: "medium",
      armorBase: 14,
    });
    expect(value(thorin({ sources: [leather] }), "armorClass")).toBe(14);
    expect(value(elara({ sources: [scale] }), "armorClass")).toBe(16);
  });

  it("Monge: 15 sem escudo, e 15 com escudo (10 + DES + 2)", () => {
    const monk = trait("Defesa sem Armadura", [
      effect("armorClass", "altBase", "10 + des.mod + sab.mod", {
        noArmor: true,
        noShield: true,
      }),
    ]);
    expect(value(kai({ sources: [monk] }), "armorClass")).toBe(15);
    const withShield = deriveStats(kai({ sources: [monk, shield()] }));
    expect(withShield.values.armorClass.value).toBe(15);
    expect(withShield.values.armorClass.parts.map((p) => p.label)).toEqual([
      "10 + DES",
      "Escudo",
    ]);
  });

  it("Armadura Arcana: 13 sem estar em efeito, 16 em efeito", () => {
    const mageArmor = (active: boolean) =>
      spell("Armadura Arcana", { active }, [
        effect("armorClass", "altBase", "13 + des.mod", { noArmor: true }),
      ]);
    expect(value(elara({ sources: [mageArmor(false)] }), "armorClass")).toBe(
      13,
    );
    expect(value(elara({ sources: [mageArmor(true)] }), "armorClass")).toBe(16);
  });

  it("composição da CA 18, com a base não usada", () => {
    const stats = deriveStats(
      thorin({ sources: [unarmoredBarbarian(), shield(), ringOfProtection()] }),
    );
    expect(stats.values.armorClass.value).toBe(18);
    expect(stats.values.armorClass.parts).toEqual([
      { label: "10 + DES", amount: 12, kind: "unused" },
      { label: "Defesa sem Armadura", amount: 15, kind: "base" },
      { label: "Escudo", amount: 2, kind: "add" },
      { label: "Anel de Proteção", amount: 1, kind: "add" },
    ]);
  });

  it("o valor manual substitui a CA calculada com efeitos", () => {
    const stats = deriveStats(
      thorin({
        sources: [unarmoredBarbarian(), shield(), ringOfProtection()],
        overrides: { armorClass: 20 },
      }),
    );
    expect(stats.values.armorClass).toMatchObject({
      value: 20,
      calculated: 18,
      overridden: true,
    });
  });
});
