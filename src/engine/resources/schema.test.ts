import { describe, expect, it } from "vitest";
import type { z } from "zod";

import {
  createTracker,
  emptySpellSlots,
  pactSlotsSchema,
  spellSlotsSchema,
  trackerSchema,
  trackerSchemaFor,
  trackersSchema,
} from "./schema";

function firstError(input: unknown, schema: z.ZodType) {
  const result = schema.safeParse(input);
  return result.success ? null : result.error.issues[0]?.message;
}

const tracker = createTracker("t1");

describe("trackerSchema", () => {
  it("aceita o tracker inicial e a Inspiração de Bardo", () => {
    expect(firstError(tracker, trackerSchema)).toBeNull();
    expect(
      firstError({ ...tracker, max: "max(1, car.mod)" }, trackerSchema),
    ).toBeNull();
  });

  it("recusa máximo inválido com a mensagem do parser", () => {
    expect(
      firstError({ ...tracker, max: "max(1, carisma)" }, trackerSchema),
    ).toBe("Variável desconhecida: carisma");
  });

  it("exige nome de 1 a 50 caracteres e recarga conhecida", () => {
    expect(firstError({ ...tracker, name: " " }, trackerSchema)).toBe(
      "O nome é obrigatório",
    );
    expect(
      firstError({ ...tracker, name: "x".repeat(51) }, trackerSchema),
    ).not.toBeNull();
    expect(
      firstError(
        { ...tracker, shortRest: { mode: "dawn", amount: "1" } },
        trackerSchema,
      ),
    ).not.toBeNull();
  });

  it("valida a quantidade recuperada como expressão", () => {
    expect(
      firstError(
        { ...tracker, shortRest: { mode: "amount", amount: "pb" } },
        trackerSchema,
      ),
    ).toBeNull();
    expect(
      firstError(
        { ...tracker, shortRest: { mode: "amount", amount: "1d4" } },
        trackerSchema,
      ),
    ).not.toBeNull();
  });
});

describe("trackersSchema", () => {
  it("recusa ids repetidos e mais de 10 trackers", () => {
    expect(firstError([tracker, { ...tracker }], trackersSchema)).toBe(
      "Id de tracker repetido",
    );
    const many = (n: number) =>
      Array.from({ length: n }, (_, i) => createTracker(`t${i}`));
    expect(firstError(many(10), trackersSchema)).toBeNull();
    expect(firstError(many(11), trackersSchema)).toBe(
      "Use no máximo 10 trackers",
    );
  });
});

describe("espaços de magia", () => {
  it("exige exatamente 9 círculos com valores de 0 a 20", () => {
    expect(firstError(emptySpellSlots(), spellSlotsSchema)).toBeNull();
    expect(
      firstError(emptySpellSlots().slice(0, 8), spellSlotsSchema),
    ).not.toBeNull();
    const slots = emptySpellSlots();
    slots[0] = { max: 21, used: 0 };
    expect(firstError(slots, spellSlotsSchema)).not.toBeNull();
  });

  it("pacto com círculo de 1 a 9", () => {
    expect(
      firstError({ level: 2, max: 2, used: 0 }, pactSlotsSchema),
    ).toBeNull();
    expect(
      firstError({ level: 0, max: 2, used: 0 }, pactSlotsSchema),
    ).not.toBeNull();
  });
});

describe("escopo das expressões (design H2)", () => {
  it("o tracker de fonte recusa dono.* e circulo", () => {
    expect(firstError({ ...tracker, max: "dono.pb" }, trackerSchema)).toBe(
      "Variável desconhecida: dono.pb",
    );
    expect(
      firstError(
        { ...tracker, longRest: { mode: "amount", amount: "circulo" } },
        trackerSchema,
      ),
    ).toBe("Variável desconhecida: circulo");
  });

  it("o uso do companheiro aceita dono.* e circulo", () => {
    const schema = trackerSchemaFor("companion");
    expect(
      firstError(
        {
          ...tracker,
          max: "dono.pb",
          longRest: { mode: "amount", amount: "circulo" },
        },
        schema,
      ),
    ).toBeNull();
  });
});
