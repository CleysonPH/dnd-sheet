import { describe, expect, it } from "vitest";

import {
  abilityScoreSchema,
  overrideValueSchema,
  speedSchema,
} from "@/engine/sheet/document";

import {
  formatDecimal,
  formatSigned,
  parseDecimal,
  parseInteger,
} from "./parse";

describe("parseInteger", () => {
  it("aceita inteiros dentro do schema", () => {
    expect(parseInteger("16", abilityScoreSchema)).toEqual({
      ok: true,
      value: 16,
    });
    expect(parseInteger(" 30 ", abilityScoreSchema)).toEqual({
      ok: true,
      value: 30,
    });
  });

  it("devolve a mensagem do schema fora do intervalo", () => {
    for (const raw of ["0", "31", "-2"]) {
      expect(parseInteger(raw, abilityScoreSchema)).toEqual({
        ok: false,
        error: "O valor vai de 1 a 30",
      });
    }
  });

  it("recusa texto, decimal e vazio", () => {
    for (const raw of ["abc", "2,5", "2.5", "", "1e1", "--1"]) {
      expect(parseInteger(raw, overrideValueSchema)).toEqual({
        ok: false,
        error: "O valor deve ser inteiro",
      });
    }
  });

  it("aceita sinal nos valores manuais", () => {
    expect(parseInteger("-2", overrideValueSchema)).toEqual({
      ok: true,
      value: -2,
    });
    expect(parseInteger("+9", overrideValueSchema)).toEqual({
      ok: true,
      value: 9,
    });
  });
});

describe("parseDecimal", () => {
  it("aceita vírgula ou ponto com até uma casa", () => {
    expect(parseDecimal("7,5", speedSchema)).toEqual({ ok: true, value: 7.5 });
    expect(parseDecimal("7.5", speedSchema)).toEqual({ ok: true, value: 7.5 });
    expect(parseDecimal("9", speedSchema)).toEqual({ ok: true, value: 9 });
  });

  it("recusa negativo, duas casas e texto", () => {
    for (const raw of ["-3", "7,25", "nove", "", "1000"]) {
      expect(parseDecimal(raw, speedSchema)).toEqual({
        ok: false,
        error: "Use um número de 0 a 999, com até uma casa decimal",
      });
    }
  });
});

describe("formatação", () => {
  it("põe sinal em modificadores", () => {
    expect([3, 0, -1].map(formatSigned)).toEqual(["+3", "+0", "-1"]);
  });

  it("usa vírgula decimal", () => {
    expect([7.5, 9].map(formatDecimal)).toEqual(["7,5", "9"]);
  });
});
