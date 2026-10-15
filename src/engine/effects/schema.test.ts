import { describe, expect, it } from "vitest";
import type { z } from "zod";

import { createEffect, effectSchema, effectsSchema } from "./schema";

function firstError(input: unknown, schema: z.ZodType = effectSchema) {
  const result = schema.safeParse(input);
  return result.success ? null : result.error.issues[0]?.message;
}

const plusOneAc = createEffect("e1");

describe("effectSchema", () => {
  it("aceita o efeito inicial (+1 CA)", () => {
    expect(firstError(plusOneAc)).toBeNull();
  });

  it("recusa operação incompatível com o alvo", () => {
    expect(
      firstError({ ...plusOneAc, target: "hitPointsMax", op: "set" }),
    ).toBe("Operação incompatível com o alvo");
    expect(
      firstError({ ...plusOneAc, target: "ability.str", op: "altBase" }),
    ).toBe("Operação incompatível com o alvo");
    expect(
      firstError({ ...plusOneAc, target: "skill.all", op: "proficiency" }),
    ).toBeNull();
  });

  it("recusa expressão inválida nas operações que a usam", () => {
    expect(firstError({ ...plusOneAc, expression: "10 + força" })).toBe(
      "Variável desconhecida: força",
    );
    expect(firstError({ ...plusOneAc, expression: "" })).toBe(
      "Expressão vazia",
    );
  });

  it("proficiência ignora a expressão", () => {
    expect(
      firstError({
        ...plusOneAc,
        target: "skill.stealth",
        op: "proficiency",
        expression: "",
        proficiency: "expertise",
      }),
    ).toBeNull();
  });

  it("recusa alvo desconhecido", () => {
    expect(firstError({ ...plusOneAc, target: "attack" })).not.toBeNull();
  });
});

describe("effectsSchema", () => {
  it("recusa ids repetidos", () => {
    expect(firstError([plusOneAc, { ...plusOneAc }], effectsSchema)).toBe(
      "Id de efeito repetido",
    );
  });

  it("aceita até 20 efeitos", () => {
    const many = (n: number) =>
      Array.from({ length: n }, (_, i) => createEffect(`e${i}`));
    expect(firstError(many(20), effectsSchema)).toBeNull();
    expect(firstError(many(21), effectsSchema)).toBe(
      "Use no máximo 20 efeitos",
    );
  });
});
