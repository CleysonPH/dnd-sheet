import { describe, expect, it } from "vitest";

import { createEffect } from "@/engine/effects/schema";
import {
  createSheetDocument,
  type SheetDocument,
} from "@/engine/sheet/document";
import { createSource } from "@/engine/sources/rules";
import type { Spell } from "@/engine/sources/schema";

import {
  concentratingSpell,
  concentrationSaveDc,
  endConcentration,
  enforceSingleConcentration,
} from "./concentration";
import { deriveStats } from "./derive";

function spell(name: string, patch: Partial<Spell> = {}): Spell {
  return { ...createSource("spell", name, name), level: 1, ...patch };
}

/** Escudo da Fé: concentração e +2 na CA enquanto em efeito. */
const shieldOfFaith = (active = true) =>
  spell("Escudo da Fé", {
    concentration: true,
    active,
    effects: [{ ...createEffect("e1"), expression: "2" }],
  });
const bless = (active = true) =>
  spell("Bênção", { concentration: true, active });
const mageArmor = spell("Armadura Arcana", { active: true });

function elara(sources: Spell[]): SheetDocument {
  return { ...createSheetDocument("Elara"), sources };
}

const armorClass = (document: SheetDocument) =>
  deriveStats(document).values.armorClass.value;

describe("concentratingSpell", () => {
  it("é a magia de concentração em efeito", () => {
    expect(concentratingSpell([mageArmor, shieldOfFaith()])?.name).toBe(
      "Escudo da Fé",
    );
  });

  it("ignora magia sem concentração e magia fora de efeito", () => {
    expect(concentratingSpell([mageArmor, shieldOfFaith(false)])).toBeNull();
  });

  it("com duas, fica a primeira na ordem da ficha", () => {
    expect(concentratingSpell([bless(), shieldOfFaith()])?.name).toBe("Bênção");
  });
});

describe("endConcentration", () => {
  it("tira as concentrações de efeito, e a CA volta", () => {
    const concentrated = elara([shieldOfFaith(), bless(), mageArmor]);
    expect(armorClass(concentrated)).toBe(12);

    const ended = endConcentration(concentrated);

    expect(armorClass(ended)).toBe(10);
    expect(ended.sources.map((s) => s.kind === "spell" && s.active)).toEqual([
      false,
      false,
      true,
    ]);
  });

  it("sem concentração, devolve a mesma ficha", () => {
    const document = elara([mageArmor]);
    expect(endConcentration(document)).toBe(document);
  });
});

describe("concentrationSaveDc", () => {
  it.each([
    [14, 10],
    [1, 10],
    [21, 10],
    [22, 11],
    [46, 23],
    [100, 30],
  ])("%i de dano dá CD %i", (damage, dc) => {
    expect(concentrationSaveDc(damage)).toBe(dc);
  });
});

describe("enforceSingleConcentration", () => {
  it("pôr Bênção em efeito encerra Escudo da Fé", () => {
    const sources = [shieldOfFaith(), bless(), mageArmor];

    const result = enforceSingleConcentration(sources, "Bênção");

    expect(concentratingSpell(result)?.name).toBe("Bênção");
    expect(result.map((s) => s.kind === "spell" && s.active)).toEqual([
      false,
      true,
      true,
    ]);
  });

  it("Armadura Arcana, sem concentração, não mexe em nada", () => {
    const sources = [shieldOfFaith(), mageArmor];
    expect(enforceSingleConcentration(sources, "Armadura Arcana")).toEqual(
      sources,
    );
  });

  it("magia de concentração fora de efeito não mexe em nada", () => {
    const sources = [shieldOfFaith(), bless(false)];
    expect(enforceSingleConcentration(sources, "Bênção")).toEqual(sources);
  });
});
