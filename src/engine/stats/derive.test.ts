import { describe, expect, it } from "vitest";

import {
  createSheetDocument,
  type SheetDocument,
} from "@/engine/sheet/document";

import { deriveStats } from "./derive";
import type { DerivedKey } from "./keys";

type Patch = {
  level?: number;
  abilities?: Partial<SheetDocument["abilities"]>;
  savingThrows?: Partial<SheetDocument["savingThrows"]>;
  skills?: Partial<SheetDocument["skills"]>;
  hitPoints?: Partial<SheetDocument["hitPoints"]>;
  overrides?: SheetDocument["overrides"];
};

function sheet(name: string, patch: Patch = {}): SheetDocument {
  const base = createSheetDocument(name);
  return {
    ...base,
    identity: { ...base.identity, level: patch.level ?? base.identity.level },
    abilities: { ...base.abilities, ...patch.abilities },
    savingThrows: { ...base.savingThrows, ...patch.savingThrows },
    skills: { ...base.skills, ...patch.skills },
    hitPoints: { ...base.hitPoints, ...patch.hitPoints },
    overrides: { ...patch.overrides },
  };
}

/** Junta dois patches campo a campo, com `patch` por cima de `base`. */
function merge(base: Patch, patch: Patch): Patch {
  return {
    level: patch.level ?? base.level,
    abilities: { ...base.abilities, ...patch.abilities },
    savingThrows: { ...base.savingThrows, ...patch.savingThrows },
    skills: { ...base.skills, ...patch.skills },
    hitPoints: { ...base.hitPoints, ...patch.hitPoints },
    overrides: { ...base.overrides, ...patch.overrides },
  };
}

/** Thorin, Bárbaro nível 5 (cenários da spec). */
function thorin(patch: Patch = {}) {
  return sheet(
    "Thorin",
    merge(
      {
        level: 5,
        abilities: { str: 16, dex: 14, con: 16, int: 8, wis: 12, cha: 10 },
        savingThrows: { str: true, con: true },
        skills: { athletics: "proficient", perception: "proficient" },
        hitPoints: { hitDie: 12 },
      },
      patch,
    ),
  );
}

/** Elara, Ladina nível 3 (cenários da spec). */
function elara(patch: Patch = {}) {
  return sheet(
    "Elara",
    merge(
      {
        level: 3,
        abilities: { str: 8, dex: 17, con: 14, int: 13, wis: 12, cha: 14 },
        savingThrows: { dex: true, int: true },
        skills: { stealth: "expertise", perception: "proficient" },
        hitPoints: { hitDie: 8 },
      },
      patch,
    ),
  );
}

function value(document: SheetDocument, key: DerivedKey) {
  return deriveStats(document).values[key].value;
}

function values(document: SheetDocument, keys: DerivedKey[]) {
  const stats = deriveStats(document);
  return keys.map((key) => stats.values[key].value);
}

describe("deriveStats: atributos e proficiência", () => {
  it("calcula os modificadores de Thorin", () => {
    expect(
      values(thorin(), [
        "mod.str",
        "mod.dex",
        "mod.con",
        "mod.int",
        "mod.wis",
        "mod.cha",
      ]),
    ).toEqual([3, 2, 3, -1, 1, 0]);
  });

  it.each([
    [1, -5],
    [9, -1],
    [10, 0],
    [17, 3],
    [30, 10],
  ])("atributo %i -> modificador %i", (score, expected) => {
    expect(value(sheet("X", { abilities: { str: score } }), "mod.str")).toBe(
      expected,
    );
  });

  it.each([
    [1, 2],
    [4, 2],
    [5, 3],
    [9, 4],
    [13, 5],
    [17, 6],
    [20, 6],
  ])("nível %i -> bônus de proficiência +%i", (level, expected) => {
    expect(value(sheet("X", { level }), "proficiencyBonus")).toBe(expected);
  });

  it("subir do nível 4 para o 5 soma 1 nas perícias e salvaguardas proficientes", () => {
    const keys: DerivedKey[] = ["skill.athletics", "save.str", "skill.stealth"];
    expect(values(thorin({ level: 4 }), keys)).toEqual([5, 5, 2]);
    expect(values(thorin({ level: 5 }), keys)).toEqual([6, 6, 2]);
  });
});

describe("deriveStats: salvaguardas e perícias", () => {
  it("calcula as salvaguardas de Thorin", () => {
    expect(
      values(thorin(), [
        "save.str",
        "save.dex",
        "save.con",
        "save.int",
        "save.wis",
        "save.cha",
      ]),
    ).toEqual([6, 2, 6, -1, 1, 0]);
  });

  it("marcar a salvaguarda de Sabedoria leva de +1 a +4", () => {
    expect(value(thorin({ savingThrows: { wis: true } }), "save.wis")).toBe(4);
  });

  it("calcula as perícias de Thorin", () => {
    expect(
      values(thorin(), [
        "skill.athletics",
        "skill.perception",
        "skill.stealth",
      ]),
    ).toEqual([6, 4, 2]);
  });

  it("expertise de Elara soma duas vezes o bônus", () => {
    expect(value(elara(), "skill.stealth")).toBe(7);
  });
});

describe("deriveStats: iniciativa e percepção passiva", () => {
  it("Thorin: iniciativa +2 e percepção passiva 14", () => {
    expect(values(thorin(), ["initiative", "passivePerception"])).toEqual([
      2, 14,
    ]);
  });

  it("Elara: percepção +3 e passiva 13", () => {
    expect(values(elara(), ["skill.perception", "passivePerception"])).toEqual([
      3, 13,
    ]);
  });

  it("ficha nova: tudo +0, PB +2 e percepção passiva 10", () => {
    const stats = deriveStats(createSheetDocument("Grog"));
    expect(stats.values["mod.str"].value).toBe(0);
    expect(stats.values.proficiencyBonus.value).toBe(2);
    expect(stats.values.passivePerception.value).toBe(10);
    expect(
      Object.values(stats.values).some((derived) => derived.overridden),
    ).toBe(false);
  });
});

describe("deriveStats: pontos de vida e dados de vida", () => {
  it("Thorin, nível 5 com d12 e CON 16: 55 PV", () => {
    expect(value(thorin(), "hitPointsMax")).toBe(55);
  });

  it("Elara, nível 3 com d8 e CON 14: 24 PV", () => {
    expect(value(elara(), "hitPointsMax")).toBe(24);
  });

  it("cada nível soma no mínimo 1 PV", () => {
    const document = sheet("X", {
      level: 2,
      abilities: { con: 1 },
      hitPoints: { hitDie: 6 },
    });
    expect(value(document, "hitPointsMax")).toBe(2);
  });

  it("CON 16 -> 18 leva Thorin de 55 a 60", () => {
    expect(value(thorin({ abilities: { con: 18 } }), "hitPointsMax")).toBe(60);
  });

  it("o PV atual é o máximo menos o dano, e acompanha a subida de nível", () => {
    const hurt = { damage: 15 };
    expect(deriveStats(thorin({ hitPoints: hurt })).hitPointsCurrent).toBe(40);

    const levelSix = deriveStats(thorin({ level: 6, hitPoints: hurt }));
    expect(levelSix.values.hitPointsMax.value).toBe(65);
    expect(levelSix.hitPointsCurrent).toBe(50);
  });

  it("o PV atual não fica negativo quando o máximo cai abaixo do dano", () => {
    // Nível 1, d8, CON 14: máximo 10. Com 8 de dano, fica em 2.
    const document = sheet("X", {
      abilities: { con: 14 },
      hitPoints: { damage: 8 },
    });
    expect(deriveStats(document).hitPointsCurrent).toBe(2);
    // CON 8: máximo 7, abaixo do dano.
    const lower = { ...document, abilities: { ...document.abilities, con: 8 } };
    expect(value(lower, "hitPointsMax")).toBe(7);
    expect(deriveStats(lower).hitPointsCurrent).toBe(0);
  });

  it("ficha migrada no nível 5 com d8 e CON 10: 28 PV e 5/5 dados", () => {
    const stats = deriveStats(sheet("Thorin", { level: 5 }));
    expect(stats.values.hitPointsMax.value).toBe(28);
    expect(stats.hitPointsCurrent).toBe(28);
    expect(stats.values.hitDiceMax.value).toBe(5);
    expect(stats.hitDiceAvailable).toBe(5);
  });

  it("dados de vida disponíveis descontam os gastos, sem ficar negativos", () => {
    const spent = (hitDiceSpent: number) =>
      deriveStats(thorin({ hitPoints: { hitDiceSpent } })).hitDiceAvailable;
    expect(spent(2)).toBe(3);
    expect(spent(7)).toBe(0);
  });
});

describe("deriveStats: valores manuais", () => {
  it("o valor manual substitui o calculado e guarda o calculado", () => {
    const stats = deriveStats(thorin({ overrides: { hitPointsMax: 61 } }));
    expect(stats.values.hitPointsMax).toEqual({
      value: 61,
      calculated: 55,
      overridden: true,
    });
    expect(stats.values.initiative.overridden).toBe(false);
  });

  it("modificador manual de DES muda Iniciativa e Acrobacia", () => {
    const document = thorin({ overrides: { "mod.dex": 4 } });
    expect(values(document, ["initiative", "skill.acrobatics"])).toEqual([
      4, 4,
    ]);
  });

  it("Percepção manual muda a passiva", () => {
    const document = thorin({ overrides: { "skill.perception": 6 } });
    expect(value(document, "passivePerception")).toBe(16);
  });

  it("PV máximo manual mantém o dano: 40/55 vira 46/61", () => {
    const stats = deriveStats(
      thorin({
        hitPoints: { damage: 15 },
        overrides: { hitPointsMax: 61 },
      }),
    );
    expect(stats.hitPointsCurrent).toBe(46);
  });

  it("total manual de dados de vida muda os disponíveis", () => {
    const stats = deriveStats(
      thorin({
        hitPoints: { hitDiceSpent: 2 },
        overrides: { hitDiceMax: 7 },
      }),
    );
    expect(stats.hitDiceAvailable).toBe(5);
  });

  it("o valor manual fica quando o cálculo muda", () => {
    const overrides = { "skill.stealth": 9 };
    const before = deriveStats(elara({ overrides })).values["skill.stealth"];
    const after = deriveStats(elara({ overrides, abilities: { dex: 18 } }))
      .values["skill.stealth"];
    expect([before.value, before.calculated]).toEqual([9, 7]);
    expect([after.value, after.calculated]).toEqual([9, 8]);
  });
});
