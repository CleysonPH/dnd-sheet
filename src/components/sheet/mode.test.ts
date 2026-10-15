import { describe, expect, it } from "vitest";

import { createSheetDocument } from "@/engine/sheet/document";
import { hitPointsAmountSchema } from "@/engine/stats/hit-points";

import { initialSheetMode } from "./mode";
import { parseInteger } from "./parse";

describe("initialSheetMode", () => {
  it("ficha com todos os atributos em 10 abre em Editar", () => {
    expect(initialSheetMode(createSheetDocument("Grog"))).toBe("edit");
  });

  it("ficha com algum atributo diferente de 10 abre em Jogar", () => {
    const document = createSheetDocument("Thorin");
    document.abilities.str = 16;
    expect(initialSheetMode(document)).toBe("play");
  });
});

describe("quantidade de dano e cura", () => {
  it("aceita de 1 a 999", () => {
    expect(parseInteger("7", hitPointsAmountSchema)).toEqual({
      ok: true,
      value: 7,
    });
    expect(parseInteger("999", hitPointsAmountSchema).ok).toBe(true);
  });

  it("recusa 0, negativos, texto e acima de 999", () => {
    for (const raw of ["0", "-5", "abc", "1000", ""]) {
      expect(parseInteger(raw, hitPointsAmountSchema)).toEqual({
        ok: false,
        error: "A quantidade vai de 1 a 999",
      });
    }
  });
});
