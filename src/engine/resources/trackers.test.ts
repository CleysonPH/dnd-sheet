import { describe, expect, it } from "vitest";

import {
  createSheetDocument,
  type SheetDocument,
} from "@/engine/sheet/document";
import { createSource } from "@/engine/sources/rules";
import { deriveStats } from "@/engine/stats/derive";

import { createTracker, type Tracker } from "./schema";
import { recover, resolveTrackers, spend } from "./trackers";

/** Ária, bardo nível 5. */
function aria(cha: number, tracker: Partial<Tracker>): SheetDocument {
  const doc = createSheetDocument("Ária");
  return {
    ...doc,
    identity: { ...doc.identity, level: 5 },
    abilities: { ...doc.abilities, cha },
    sources: [
      {
        ...createSource("trait", "Inspiração de Bardo", "s1"),
        trackers: [
          {
            ...createTracker("t1"),
            name: "Inspiração",
            max: "max(1, car.mod)",
            ...tracker,
          },
        ],
      },
    ],
  };
}

function resolved(document: SheetDocument) {
  return resolveTrackers(document, deriveStats(document).variables)[0]!;
}

describe("resolveTrackers", () => {
  it("Inspiração de Bardo com CAR 16: 3 de 3", () => {
    expect(resolved(aria(16, {}))).toMatchObject({
      sourceName: "Inspiração de Bardo",
      max: 3,
      current: 3,
    });
  });

  it("CAR 8: mínimo de 1", () => {
    expect(resolved(aria(8, {})).max).toBe(1);
  });

  it("2 de 3 vira 3 de 4 quando o CAR sobe para 18", () => {
    expect(resolved(aria(16, { used: 1 }))).toMatchObject({
      max: 3,
      current: 2,
    });
    expect(resolved(aria(18, { used: 1 }))).toMatchObject({
      max: 4,
      current: 3,
    });
  });

  it("máximo negativo vale 0", () => {
    expect(resolved(aria(16, { max: "car.mod - 10" }))).toMatchObject({
      max: 0,
      current: 0,
    });
  });

  it("divisão por zero vale 0 e sinaliza o erro", () => {
    expect(resolved(aria(16, { max: "10 / (car.mod - 3)" }))).toMatchObject({
      max: 0,
      current: 0,
      error: "Divisão por zero",
    });
  });
});

describe("spend e recover", () => {
  it("gasta até 0 e recupera até o máximo", () => {
    expect(spend(0, 3)).toBe(1);
    expect(spend(3, 3)).toBe(3);
    expect(recover(1, 3)).toBe(0);
    expect(recover(0, 3)).toBe(0);
  });

  it("usado acima do máximo recupera a partir do máximo", () => {
    expect(recover(5, 3)).toBe(2);
    expect(spend(5, 3)).toBe(5);
  });
});
