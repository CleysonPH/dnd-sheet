import { describe, expect, it } from "vitest";

import { DERIVED_KEYS, SKILL_ABILITY, proficiencyBonusForLevel } from "./keys";

describe("SKILL_ABILITY", () => {
  it("tem as 18 perícias do 5.5e com seus atributos", () => {
    expect(SKILL_ABILITY).toEqual({
      acrobatics: "dex",
      animalHandling: "wis",
      arcana: "int",
      athletics: "str",
      performance: "cha",
      deception: "cha",
      stealth: "dex",
      history: "int",
      intimidation: "cha",
      insight: "wis",
      investigation: "int",
      medicine: "wis",
      nature: "int",
      perception: "wis",
      persuasion: "cha",
      sleightOfHand: "dex",
      religion: "int",
      survival: "wis",
    });
  });
});

describe("proficiencyBonusForLevel", () => {
  it.each([
    [1, 2],
    [4, 2],
    [5, 3],
    [8, 3],
    [9, 4],
    [13, 5],
    [17, 6],
    [20, 6],
  ])("nível %i -> +%i", (level, expected) => {
    expect(proficiencyBonusForLevel(level)).toBe(expected);
  });
});

describe("DERIVED_KEYS", () => {
  it("lista 37 valores derivados sem repetição", () => {
    expect(DERIVED_KEYS).toHaveLength(37);
    expect(new Set(DERIVED_KEYS).size).toBe(37);
  });
});
