import { describe, expect, it } from "vitest";

import { GRANT_TARGETS, operationsFor } from "./targets";
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

describe("alvos de magia", () => {
  it.each(["spellSaveDc", "spellAttack"] as const)(
    "%s só aceita somar",
    (target) => {
      expect(operationsFor(target)).toEqual(["add"]);
    },
  );
});

describe("conceder", () => {
  const grant = (target: string, value: string) => ({
    ...plusOneAc,
    target,
    op: "grant",
    expression: "",
    value,
  });

  it.each(GRANT_TARGETS)("%s só aceita conceder", (target) => {
    expect(operationsFor(target)).toEqual(["grant"]);
  });

  it("os alvos numéricos não aceitam conceder", () => {
    expect(firstError({ ...plusOneAc, op: "grant" })).toBe(
      "Operação incompatível com o alvo",
    );
    expect(
      firstError({ ...grant("proficiency.armor", "heavy"), op: "add" }),
    ).toBe("Operação incompatível com o alvo");
  });

  it("aceita só valores da lista nos alvos fechados", () => {
    expect(firstError(grant("proficiency.armor", "heavy"))).toBeNull();
    expect(firstError(grant("proficiency.armor", "pesada"))).toBe(
      "Escolha um item da lista",
    );
    expect(firstError(grant("defense.resistance", "fire"))).toBeNull();
    expect(
      firstError(grant("defense.conditionImmunity", "exhaustion")),
    ).toBeNull();
  });

  it("aceita texto livre de 1 a 50 caracteres nos alvos livres", () => {
    expect(firstError(grant("language", "Élfico"))).toBeNull();
    expect(firstError(grant("proficiency.weapon", "martial"))).toBeNull();
    expect(firstError(grant("proficiency.weapon", "Espada longa"))).toBeNull();
    expect(firstError(grant("language", ""))).toBe("Informe um nome");
    expect(firstError(grant("proficiency.tool", "   "))).toBe(
      "Informe um nome",
    );
    expect(firstError(grant("language", "x".repeat(51)))).not.toBeNull();
  });

  it("as outras operações ignoram o valor", () => {
    expect(firstError({ ...plusOneAc, value: "qualquer coisa" })).toBeNull();
  });
});

describe("escopo das expressões (design H2)", () => {
  it("o efeito de fonte recusa dono.* e circulo", () => {
    expect(firstError({ ...plusOneAc, expression: "dono.con.mod" })).toBe(
      "Variável desconhecida: dono.con.mod",
    );
    expect(firstError({ ...plusOneAc, expression: "circulo" })).toBe(
      "Variável desconhecida: circulo",
    );
  });
});
