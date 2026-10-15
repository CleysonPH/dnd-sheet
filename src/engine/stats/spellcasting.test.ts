import { describe, expect, it } from "vitest";

import { createEffect } from "@/engine/effects/schema";
import type { EffectTarget } from "@/engine/effects/targets";
import {
  createSheetDocument,
  type SheetDocument,
} from "@/engine/sheet/document";
import { createSource } from "@/engine/sources/rules";
import type { Item } from "@/engine/sources/schema";

import { deriveStats, spellcastingFor } from "./derive";

/** Ária: bardo nível 5 (PB +3), CAR 16, INT 12, conjuração Carisma. */
function aria(patch: Partial<SheetDocument> = {}): SheetDocument {
  const doc = createSheetDocument("Ária");
  return {
    ...doc,
    identity: { ...doc.identity, level: 5 },
    abilities: { ...doc.abilities, cha: 16, int: 12 },
    spellcastingAbility: "cha",
    ...patch,
  };
}

const add = (id: string, target: EffectTarget) => ({
  ...createEffect(id),
  target,
  op: "add" as const,
  expression: "1",
});

/** Bastão do Pacto sintonizado: +1 na CD de magia e no ataque mágico. */
const rodOfThePactKeeper: Item = {
  ...createSource("item", "Bastão do Pacto", "i1"),
  equipped: true,
  requiresAttunement: true,
  attuned: true,
  effects: [add("e1", "spellSaveDc"), add("e2", "spellAttack")],
};

describe("CD de magia e ataque mágico da ficha", () => {
  it("Ária: CD 14 e ataque +6", () => {
    const { values } = deriveStats(aria());
    expect(values.spellSaveDc.value).toBe(14);
    expect(values.spellAttack.value).toBe(6);
  });

  it("o Bastão do Pacto soma 1 nos dois, e a origem lista as partes", () => {
    const { values } = deriveStats(aria({ sources: [rodOfThePactKeeper] }));
    expect(values.spellSaveDc.value).toBe(15);
    expect(values.spellAttack.value).toBe(7);
    expect(
      values.spellSaveDc.parts.map((part) => [part.label, part.amount]),
    ).toEqual([
      ["Base", 8],
      ["Modificador de CAR", 3],
      ["Proficiência", 3],
      ["Bastão do Pacto", 1],
    ]);
  });

  it("o bastão sem sintonização não soma", () => {
    const rod = { ...rodOfThePactKeeper, attuned: false };
    expect(deriveStats(aria({ sources: [rod] })).values.spellSaveDc.value).toBe(
      14,
    );
  });

  it("usa o modificador manual de CAR", () => {
    const { values } = deriveStats(aria({ overrides: { "mod.cha": 4 } }));
    expect(values.spellSaveDc.value).toBe(15);
    expect(values.spellAttack.value).toBe(7);
  });

  it("aceita valor manual na CD", () => {
    const { spellSaveDc } = deriveStats(
      aria({ overrides: { spellSaveDc: 16 } }),
    ).values;
    expect(spellSaveDc).toMatchObject({
      value: 16,
      calculated: 14,
      overridden: true,
    });
  });

  it("sem atributo de conjuração, o modificador vale 0", () => {
    const { values } = deriveStats(aria({ spellcastingAbility: "none" }));
    expect(values.spellSaveDc.value).toBe(11);
    expect(values.spellAttack.value).toBe(3);
  });
});

describe("spellcastingFor", () => {
  it("Passo Nebuloso com INT 12: CD 12 e +4", () => {
    expect(spellcastingFor(deriveStats(aria()), "int")).toEqual({
      saveDc: 12,
      attack: 4,
    });
  });

  it("os efeitos da ficha valem para a magia: 13 e +5", () => {
    const stats = deriveStats(aria({ sources: [rodOfThePactKeeper] }));
    expect(spellcastingFor(stats, "int")).toEqual({ saveDc: 13, attack: 5 });
  });

  it("o valor manual da CD da ficha não passa para a magia", () => {
    const stats = deriveStats(aria({ overrides: { spellSaveDc: 20 } }));
    expect(spellcastingFor(stats, "int").saveDc).toBe(12);
  });
});
