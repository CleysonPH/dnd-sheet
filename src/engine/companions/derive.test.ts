import { describe, expect, it } from "vitest";

import {
  createSheetDocument,
  type SheetDocument,
} from "@/engine/sheet/document";
import { deriveStats } from "@/engine/stats/derive";

import { createAction, createPart, type Action } from "@/engine/attacks/schema";

import { deriveCompanion, deriveCompanionActions } from "./derive";
import { createCompanion, type Companion } from "./schema";

function owner(
  level: number,
  abilities: Partial<SheetDocument["abilities"]> = {},
): SheetDocument {
  const doc = createSheetDocument("Dono");
  return {
    ...doc,
    identity: { ...doc.identity, level },
    abilities: { ...doc.abilities, ...abilities },
  };
}

/** Brann: pugilista nível 5, CON 16, PB +3. */
const brann = owner(5, { con: 16 });

/** Hound do Dog and Hound, com o Pack Bond. */
const hound: Companion = {
  ...createCompanion("c1"),
  name: "Hound",
  abilities: { str: 14, dex: 14, con: 15, int: 3, wis: 12, cha: 13 },
  allChecks: true,
  armorClass: "12 + dono.con.mod",
  hitPointsMax: "5 + 5 * nivel",
  hitDiceCount: "nivel",
  hitDie: 8,
};

/** Coruja do Find Familiar, com números fixos e PB próprio. */
const owl: Companion = {
  ...createCompanion("c2"),
  name: "Coruja",
  abilities: { str: 3, dex: 13, con: 8, int: 2, wis: 12, cha: 7 },
  pbMode: "own",
  pb: 2,
  skills: { ...createCompanion("c2").skills, perception: "expertise" },
  armorClass: "11",
  hitPointsMax: "1",
  hitDiceCount: "1",
  hitDie: 4,
};

/** Otherworldly Steed do Find Steed, invocado no 2º círculo. */
const steed: Companion = {
  ...createCompanion("c3"),
  name: "Otherworldly Steed",
  abilities: { str: 18, dex: 12, con: 14, int: 6, wis: 12, cha: 8 },
  summon: { enabled: true, minLevel: 2, level: 2 },
  armorClass: "10 + circulo",
  hitPointsMax: "5 + 10 * circulo",
  hitDiceCount: "circulo",
  hitDie: 10,
};

function derive(companion: Companion, doc = brann) {
  return deriveCompanion(companion, deriveStats(doc));
}

describe("deriveCompanion", () => {
  it("Hound de Brann: CA 15, PV 30 e 5d8, com o PB do dono", () => {
    const stats = derive(hound);
    expect(stats.armorClass).toEqual({ value: 15 });
    expect(stats.hitPointsMax).toEqual({ value: 30 });
    expect(stats.hitDiceMax).toEqual({ value: 5 });
    expect(stats.hitPointsCurrent).toBe(30);
    expect(stats.pb).toBe(3);
    expect(derive(hound, owner(4, { con: 16 })).pb).toBe(2);
  });

  it("Pack Bond soma o PB em salvaguardas e perícias", () => {
    const stats = derive(hound);
    expect(stats.saves.str.value).toBe(5);
    expect(stats.saves.int.value).toBe(-1);
    expect(stats.skills.athletics.value).toBe(5);
    const without = derive({ ...hound, allChecks: false });
    expect(without.saves.str.value).toBe(2);
  });

  it("a iniciativa é o modificador de DES, mesmo com Pack Bond", () => {
    expect(derive(hound).initiative).toBe(2);
  });

  it("especialista com Pack Bond mantém o dobro", () => {
    const stats = derive({
      ...hound,
      skills: { ...hound.skills, perception: "expertise" },
    });
    expect(stats.skills.perception).toEqual({ value: 7, multiplier: 2 });
  });

  it("Coruja usa o PB próprio mesmo com o dono no nível 9", () => {
    const stats = derive(owl, owner(9));
    expect(stats.pb).toBe(2);
    expect(stats.saves.dex.value).toBe(1);
    expect(stats.skills.perception.value).toBe(5);
    expect(stats.passivePerception).toBe(15);
    expect(stats.armorClass.value).toBe(11);
  });

  it("Steed escala com o círculo", () => {
    const second = derive(steed);
    expect([second.armorClass.value, second.hitPointsMax.value]).toEqual([
      12, 25,
    ]);
    expect(second.hitDiceMax.value).toBe(2);
    const fourth = derive({ ...steed, summon: { ...steed.summon, level: 4 } });
    expect([fourth.armorClass.value, fourth.hitPointsMax.value]).toEqual([
      14, 45,
    ]);
    expect(fourth.hitDiceMax.value).toBe(4);
    expect(fourth.spellLevel).toBe(4);
  });

  it("o círculo abaixo do mínimo usa o mínimo", () => {
    const stats = derive({ ...steed, summon: { ...steed.summon, level: 1 } });
    expect(stats.spellLevel).toBe(2);
    expect(stats.armorClass.value).toBe(12);
  });

  it("circulo sem invocação vale 0", () => {
    const stats = derive({
      ...steed,
      summon: { ...steed.summon, enabled: false },
    });
    expect(stats.spellLevel).toBeNull();
    expect(stats.armorClass.value).toBe(10);
  });

  it("divisão por zero vale 0 e traz o erro", () => {
    const stats = derive({
      ...hound,
      hitPointsMax: "10 / (dono.pb - dono.pb)",
    });
    expect(stats.hitPointsMax).toEqual({ value: 0, error: "Divisão por zero" });
    expect(stats.down).toBe(true);
  });

  it("um resultado negativo vale 0", () => {
    expect(derive({ ...hound, armorClass: "0 - 5" }).armorClass).toEqual({
      value: 0,
    });
  });

  it("o PV atual desconta o dano, sem ficar abaixo de 0", () => {
    expect(derive({ ...hound, damage: 7 }).hitPointsCurrent).toBe(23);
    expect(derive({ ...hound, damage: 40 }).hitPointsCurrent).toBe(0);
    expect(derive({ ...hound, hitDiceSpent: 2 }).hitDiceAvailable).toBe(3);
  });
});

describe("deriveCompanionActions", () => {
  const bite: Action = {
    ...createAction({ kind: "companion" }, "a1"),
    name: "Mordida",
    attackAbility: "none",
    proficiency: "always",
    attackBonus: "dono.con.mod",
    parts: [
      createPart("p1", {
        count: 2,
        die: "d4",
        bonus: "2 + dono.con.mod",
        type: "piercing",
      }),
    ],
  };
  const knockDown: Action = {
    ...createAction({ kind: "companion" }, "a2"),
    name: "Derrubar",
    resolution: "save",
    saveAbility: "str",
    dcMode: "expression",
    dcExpression: "8 + dono.con.mod + pb",
  };

  function lines(companion: Companion, doc = brann) {
    const ownerStats = deriveStats(doc);
    return deriveCompanionActions(
      companion,
      deriveCompanion(companion, ownerStats),
      ownerStats,
    );
  }

  it("Mordida do Hound: +6 e 2d4+5 perfurante", () => {
    const [line] = lines({ ...hound, actions: [bite] });
    expect(line?.toHit?.value).toBe(6);
    expect(line?.parts[0]).toMatchObject({
      count: 2,
      die: "d4",
      modifier: 5,
      type: "piercing",
    });
    expect(line?.sourceName).toBe("Hound");
  });

  it("a linha leva a descrição da ação", () => {
    const description = "Alvo Grande ou menor: salvaguarda de FOR";
    const [line] = lines({ ...hound, actions: [{ ...bite, description }] });
    expect(line?.description).toBe(description);
  });

  it("Derrubar: FOR CD 14 por expressão", () => {
    const [line] = lines({ ...hound, actions: [knockDown] });
    expect(line?.dc?.value).toBe(14);
    expect(line?.saveAbility).toBe("str");
  });

  it("Otherworldly Slam usa o ataque mágico do dono e o círculo", () => {
    // Elara: paladina nível 5, CAR 16 (+3), PB +3: ataque mágico +6.
    const elara: SheetDocument = {
      ...owner(5, { cha: 16 }),
      spellcastingAbility: "cha",
    };
    const slam: Action = {
      ...createAction({ kind: "companion" }, "a1"),
      attackAbility: "spellcasting",
      parts: [
        createPart("p1", { die: "d8", bonus: "circulo", type: "radiant" }),
      ],
    };
    const fourth = { ...steed, summon: { ...steed.summon, level: 4 } };
    const [line] = lines({ ...fourth, actions: [slam] }, elara);
    expect(line?.toHit?.value).toBe(6);
    expect(line?.toHit?.parts[0]?.label).toBe("Ataque mágico do dono");
    expect(line?.parts[0]?.modifier).toBe(4);
  });

  it("conjuração no dano usa o modificador do dono", () => {
    const elara: SheetDocument = {
      ...owner(5, { cha: 16 }),
      spellcastingAbility: "cha",
    };
    const heal: Action = {
      ...createAction({ kind: "companion" }, "a1"),
      resolution: "auto",
      parts: [createPart("p1", { ability: "spellcasting", type: "healing" })],
    };
    const [line] = lines({ ...steed, actions: [heal] }, elara);
    expect(line?.parts[0]?.modifier).toBe(3);
  });

  it("a proficiência automática é sempre proficiente", () => {
    const [line] = lines({
      ...hound,
      actions: [{ ...bite, proficiency: "auto" }],
    });
    expect(line?.toHit?.value).toBe(6);
  });

  it("ignora o upcast e escala pelo nível do dono", () => {
    const scaled: Action = {
      ...bite,
      parts: [createPart("p1", { scaleByLevel: true, upcast: 2 })],
    };
    const [line] = lines({ ...hound, actions: [scaled] });
    expect(line?.parts[0]?.count).toBe(2);
    expect(line?.parts[0]?.upcast).toBe(0);
  });

  it("a Exaustão do dono não entra no acerto", () => {
    const [line] = lines(
      { ...hound, actions: [bite] },
      { ...brann, exhaustion: 2 },
    );
    expect(line?.toHit?.value).toBe(6);
    expect(
      line?.toHit?.parts.some((part) => part.label.startsWith("Exaustão")),
    ).toBe(false);
  });
});
