import { describe, expect, it } from "vitest";
import type { z } from "zod";

import { createAction, createPart } from "@/engine/attacks/schema";
import { createTracker } from "@/engine/resources/schema";

import {
  companionSchema,
  companionsSchema,
  createCompanion,
  MAX_COMPANIONS,
  type Companion,
} from "./schema";

function firstError(input: unknown, schema: z.ZodType = companionSchema) {
  const result = schema.safeParse(input);
  return result.success ? null : result.error.issues[0]?.message;
}

const hound = createCompanion("c1");

describe("createCompanion", () => {
  it("nasce com os valores iniciais da spec", () => {
    expect(hound).toMatchObject({
      name: "Companheiro",
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      armorClass: "10",
      hitPointsMax: "1",
      hitDiceCount: "1",
      hitDie: 8,
      pbMode: "owner",
      summon: { enabled: false },
      actions: [],
      trackers: [],
    });
    expect(firstError(hound)).toBeNull();
  });
});

describe("companionSchema", () => {
  it("recusa o 5º companheiro", () => {
    const list = Array.from({ length: MAX_COMPANIONS + 1 }, (_, index) =>
      createCompanion(`c${index}`),
    );
    expect(firstError(list, companionsSchema)).toBe(
      "Use no máximo 4 companheiros",
    );
    expect(firstError(list.slice(0, 4), companionsSchema)).toBeNull();
  });

  it("recusa nome vazio, traços longos, PB 11 e círculo 10", () => {
    expect(firstError({ ...hound, name: "  " })).toBe("O nome é obrigatório");
    expect(firstError({ ...hound, traits: "a".repeat(2001) })).toBe(
      "Use no máximo 2000 caracteres",
    );
    expect(firstError({ ...hound, pb: 11 })).toBe("O valor vai de 0 a 10");
    expect(
      firstError({
        ...hound,
        summon: { enabled: true, minLevel: 2, level: 10 },
      }),
    ).toBe("O valor vai de 1 a 9");
  });

  it("aceita o círculo atual abaixo do mínimo", () => {
    expect(
      firstError({
        ...hound,
        summon: { enabled: true, minLevel: 4, level: 2 },
      }),
    ).toBeNull();
  });

  it("recusa a 7ª ação, o 11º uso e ids repetidos", () => {
    const actions = Array.from({ length: 7 }, (_, index) =>
      createAction({ kind: "companion" }, `a${index}`),
    );
    expect(firstError({ ...hound, actions })).toBe("Use no máximo 6 ações");
    const trackers = Array.from({ length: 11 }, (_, index) =>
      createTracker(`t${index}`),
    );
    expect(firstError({ ...hound, trackers })).toBe(
      "Use no máximo 10 trackers",
    );
    expect(
      firstError([hound, { ...createCompanion("c1") }], companionsSchema),
    ).toBe("Id de companheiro repetido");
  });

  it("aceita expressões com o dono e o círculo", () => {
    const bite: Companion["actions"][number] = {
      ...createAction({ kind: "companion" }, "a1"),
      attackAbility: "none",
      proficiency: "always",
      attackBonus: "dono.con.mod",
      parts: [
        createPart("p1", { count: 2, die: "d4", bonus: "2 + dono.con.mod" }),
      ],
    };
    expect(
      firstError({
        ...hound,
        armorClass: "12 + dono.con.mod",
        hitPointsMax: "5 + 10 * circulo",
        actions: [bite],
      }),
    ).toBeNull();
  });

  it("recusa expressão inválida no bloco", () => {
    expect(firstError({ ...hound, armorClass: "12 + dono.con.mod +" })).toBe(
      "Expressão incompleta",
    );
  });
});
