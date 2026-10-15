import { describe, expect, it } from "vitest";

import { createEffect } from "@/engine/effects/schema";

import { describeEffect, targetOptionLabel } from "./effect-labels";

const base = createEffect("e1");

describe("describeEffect", () => {
  it("resume os efeitos de referência", () => {
    expect(describeEffect(base)).toBe("+1 CA");
    expect(
      describeEffect({
        ...base,
        op: "altBase",
        expression: "10 + des.mod + con.mod",
        noArmor: true,
      }),
    ).toBe("CA base 10 + des.mod + con.mod (sem armadura)");
    expect(
      describeEffect({
        ...base,
        target: "ability.str",
        op: "set",
        expression: "19",
      }),
    ).toBe("FOR = 19");
    expect(
      describeEffect({
        ...base,
        target: "skill.stealth",
        op: "proficiency",
        proficiency: "expertise",
      }),
    ).toBe("Expertise em Furtividade");
    expect(
      describeEffect({
        ...base,
        target: "hitPointsMax",
        expression: "2 * nivel",
      }),
    ).toBe("PV máximo + (2 * nivel)");
    expect(
      describeEffect({ ...base, target: "save.all", expression: "-1" }),
    ).toBe("-1 todas as salvaguardas");
  });
});

describe("targetOptionLabel", () => {
  it("usa o nome completo com maiúscula", () => {
    expect(targetOptionLabel("ability.str")).toBe("Força");
    expect(targetOptionLabel("save.all")).toBe("Todas as salvaguardas");
    expect(targetOptionLabel("save.dex")).toBe("Salvaguarda de DES");
    expect(targetOptionLabel("armorClass")).toBe("CA");
  });
});
