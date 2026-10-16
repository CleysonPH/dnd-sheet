import { describe, expect, it } from "vitest";

import {
  createSheetDocument,
  type SheetDocument,
} from "@/engine/sheet/document";
import { createSource } from "@/engine/sources/rules";

import { deriveStats, spellcastingFor } from "./derive";
import type { DerivedKey } from "./keys";

function thorin(patch: Partial<SheetDocument> = {}): SheetDocument {
  const base = createSheetDocument("Thorin");
  return {
    ...base,
    abilities: { ...base.abilities, dex: 14, wis: 14 },
    // Percepção +4: SAB +2 e proficiência +2 no nível 1.
    skills: { ...base.skills, perception: "proficient" },
    ...patch,
  };
}

function elara(patch: Partial<SheetDocument> = {}): SheetDocument {
  const base = createSheetDocument("Elara");
  return {
    ...base,
    identity: { ...base.identity, level: 3 },
    abilities: { ...base.abilities, int: 16 },
    spellcastingAbility: "int",
    ...patch,
  };
}

function part(document: SheetDocument, key: DerivedKey) {
  return deriveStats(document).values[key].parts.find((p) =>
    p.label.startsWith("Exaustão"),
  );
}

describe("Exaustão nos testes de d20", () => {
  it("Thorin com Exaustão 1: Furtividade +0, com a parcela -2", () => {
    const document = thorin({ exhaustion: 1 });
    const stealth = deriveStats(document).values["skill.stealth"];
    expect(stealth.value).toBe(0);
    expect(stealth.parts).toEqual([
      { label: "Modificador de DES", amount: 2, kind: "base" },
      { label: "Exaustão 1", amount: -2, kind: "add" },
    ]);
  });

  it("a Percepção cai e a passiva não", () => {
    const rested = deriveStats(thorin()).values;
    expect(rested["skill.perception"].value).toBe(4);
    expect(rested.passivePerception.value).toBe(14);

    const tired = deriveStats(thorin({ exhaustion: 1 })).values;
    expect(tired["skill.perception"].value).toBe(2);
    expect(tired.passivePerception.value).toBe(14);
  });

  it("com Percepção manual, a passiva usa o valor manual", () => {
    const values = deriveStats(
      thorin({ exhaustion: 2, overrides: { "skill.perception": 6 } }),
    ).values;
    expect(values["skill.perception"].value).toBe(6);
    expect(values.passivePerception.value).toBe(16);
  });

  it("o valor manual substitui o calculado já com a penalidade", () => {
    const stealth = deriveStats(
      thorin({ exhaustion: 3, overrides: { "skill.stealth": 5 } }),
    ).values["skill.stealth"];
    expect(stealth.value).toBe(5);
    expect(stealth.calculated).toBe(-4);
  });

  it("Elara com Exaustão 2: ataque +1 e CD 13; magia própria também perde", () => {
    const document = elara({ exhaustion: 2 });
    const stats = deriveStats(document);
    expect(stats.values.spellAttack.value).toBe(1);
    expect(stats.values.spellSaveDc.value).toBe(13);
    expect(part(document, "spellSaveDc")).toBeUndefined();

    const rested = spellcastingFor(deriveStats(elara()), "int");
    expect(spellcastingFor(stats, "int")).toEqual({
      saveDc: rested.saveDc,
      attack: rested.attack - 4,
    });
  });

  it("iniciativa e salvaguardas recebem a parcela", () => {
    const document = thorin({ exhaustion: 2 });
    const values = deriveStats(document).values;
    expect(values.initiative.value).toBe(-2);
    expect(values["save.con"].value).toBe(-4);
    expect(part(document, "initiative")).toEqual({
      label: "Exaustão 2",
      amount: -4,
      kind: "add",
    });
  });

  it("sem Exaustão, nenhuma parcela", () => {
    const document = thorin();
    const keys: DerivedKey[] = [
      "skill.stealth",
      "save.dex",
      "initiative",
      "speed",
    ];
    for (const key of keys) expect(part(document, key)).toBeUndefined();
    expect(deriveStats(document).exhaustionPenalty).toBe(0);
  });
});

describe("Exaustão no deslocamento", () => {
  it("9 m com Exaustão 2: 6 m", () => {
    const speed = deriveStats(thorin({ exhaustion: 2 })).values.speed;
    expect(speed.value).toBe(6);
    expect(speed.parts.at(-1)).toEqual({
      label: "Exaustão 2",
      amount: -3,
      kind: "add",
    });
  });

  it("3 m com Exaustão 3: 0 m, com a parcela -3", () => {
    const speed = deriveStats(thorin({ speed: 3, exhaustion: 3 })).values.speed;
    expect(speed.value).toBe(0);
    expect(speed.parts.at(-1)).toMatchObject({ amount: -3 });
  });

  it("deslocamento já 0: sem parcela", () => {
    const document = thorin({ speed: 0, exhaustion: 1 });
    expect(deriveStats(document).values.speed.value).toBe(0);
    expect(part(document, "speed")).toBeUndefined();
  });

  it("a Exaustão não altera os itens ativos nem as fontes", () => {
    const shield = {
      ...createSource("item", "Escudo", "s1"),
      category: "shield" as const,
      equipped: true,
      shieldBonus: 2,
    };
    const values = deriveStats(
      thorin({ exhaustion: 4, sources: [shield] }),
    ).values;
    expect(values.armorClass.value).toBe(14);
  });
});
