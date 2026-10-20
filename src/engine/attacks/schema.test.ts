import { describe, expect, it } from "vitest";

import { createSource } from "@/engine/sources/rules";
import { sourceSchema } from "@/engine/sources/schema";

import {
  actionSchema,
  actionSchemaFor,
  actionsSchema,
  createAction,
  createPart,
  type Action,
} from "./schema";

const lute: Action = {
  ...createAction({ kind: "item", category: "weapon" }, "a1"),
  attackAbility: "cha",
  parts: [
    createPart("p1", { die: "d4", ability: "attack" }),
    createPart("p2", { count: 2, die: "d8", type: "thunder" }),
  ],
};

describe("actionSchema", () => {
  it("uma ação de ataque com duas partes é válida", () => {
    expect(actionSchema.safeParse(lute).success).toBe(true);
    const source = {
      ...createSource("item", "Alaúde do Trovão Retumbante", "s1"),
      category: "weapon" as const,
      actions: [lute],
    };
    expect(sourceSchema.safeParse(source).success).toBe(true);
  });

  it("recusa a 7ª ação, uma ação sem partes e a 5ª parte", () => {
    const seven = Array.from({ length: 7 }, (_, i) => ({
      ...lute,
      id: `a${i}`,
    }));
    expect(actionsSchema.safeParse(seven).success).toBe(false);
    expect(actionsSchema.safeParse(seven.slice(0, 6)).success).toBe(true);
    expect(actionSchema.safeParse({ ...lute, parts: [] }).success).toBe(false);
    const five = Array.from({ length: 5 }, (_, i) => createPart(`p${i}`));
    expect(actionSchema.safeParse({ ...lute, parts: five }).success).toBe(
      false,
    );
  });

  it("recusa count 41, upcast 21 e dcAdjust 11", () => {
    const [part] = lute.parts;
    for (const patch of [{ count: 41 }, { upcast: 21 }]) {
      expect(
        actionSchema.safeParse({ ...lute, parts: [{ ...part, ...patch }] })
          .success,
      ).toBe(false);
    }
    expect(actionSchema.safeParse({ ...lute, dcAdjust: 11 }).success).toBe(
      false,
    );
    expect(actionSchema.safeParse({ ...lute, dcAdjust: -10 }).success).toBe(
      true,
    );
  });

  it("recusa expressão inválida mesmo no campo que o modo não usa", () => {
    const save: Action = { ...lute, resolution: "save" };
    expect(actionSchema.safeParse(save).success).toBe(true);
    expect(
      actionSchema.safeParse({ ...save, attackBonus: "2 * nivel +" }).success,
    ).toBe(false);
    expect(
      actionSchema.safeParse({ ...lute, dcExpression: "8 + " }).success,
    ).toBe(false);
    const [part] = lute.parts;
    expect(
      actionSchema.safeParse({
        ...lute,
        parts: [{ ...part, bonus: "2 * nivel +" }],
      }).success,
    ).toBe(false);
  });

  it("recusa ids repetidos de ação e de parte", () => {
    expect(actionsSchema.safeParse([lute, lute]).success).toBe(false);
    const [part] = lute.parts;
    expect(
      actionSchema.safeParse({ ...lute, parts: [part, part] }).success,
    ).toBe(false);
  });

  it("aceita o atributo do ataque numa ação automática", () => {
    expect(
      actionSchema.safeParse({ ...lute, resolution: "auto" }).success,
    ).toBe(true);
  });
});

describe("createAction", () => {
  it("dá valores iniciais por tipo de fonte", () => {
    const weapon = createAction({ kind: "item", category: "weapon" }, "a");
    expect(weapon).toMatchObject({ range: "melee", attackAbility: "str" });
    expect(weapon.parts[0]).toMatchObject({ die: "d8", ability: "attack" });

    const spell = createAction({ kind: "spell" }, "a");
    expect(spell).toMatchObject({
      range: "ranged",
      attackAbility: "spellcasting",
    });
    expect(spell.parts[0]).toMatchObject({
      die: "d10",
      ability: "none",
      type: "force",
    });

    expect(createAction({ kind: "feat" }, "a").parts[0]?.die).toBe("d6");
  });
});

describe("escopo das expressões (design H2)", () => {
  it("a ação de fonte recusa dono.* e circulo", () => {
    expect(
      actionSchema.safeParse({ ...lute, attackBonus: "dono.con.mod" }).success,
    ).toBe(false);
    expect(
      actionSchema.safeParse({ ...lute, dcExpression: "8 + circulo" }).success,
    ).toBe(false);
  });

  it("a ação do companheiro aceita dono.* e circulo", () => {
    const schema = actionSchemaFor("companion");
    const bite = {
      ...lute,
      attackBonus: "dono.con.mod",
      dcExpression: "8 + dono.con.mod + pb",
      parts: [createPart("p1", { count: 2, die: "d4", bonus: "2 + circulo" })],
    };
    expect(schema.safeParse(bite).success).toBe(true);
  });
});

describe("descrição da ação (design H9)", () => {
  it("aceita até 500 caracteres e recusa 501", () => {
    expect(
      actionSchema.safeParse({ ...lute, description: "a".repeat(500) }).success,
    ).toBe(true);
    const result = actionSchema.safeParse({
      ...lute,
      description: "a".repeat(501),
    });
    expect(result.success ? null : result.error.issues[0]?.message).toBe(
      "Use no máximo 500 caracteres",
    );
  });
});
