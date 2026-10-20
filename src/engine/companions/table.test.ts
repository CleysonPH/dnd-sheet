import { describe, expect, it } from "vitest";

import { createSheetDocument } from "@/engine/sheet/document";
import { deriveStats } from "@/engine/stats/derive";

import { deriveCompanion } from "./derive";
import { createCompanion, type Companion } from "./schema";
import {
  applyCompanionDamage,
  applyCompanionHealing,
  recoverCompanionHitDie,
  setCompanionTemp,
  spendCompanionHitDie,
  toggleCompanionCondition,
} from "./table";

const hound: Companion = {
  ...createCompanion("c1"),
  name: "Hound",
  hitPointsMax: "30",
  hitDiceCount: "5",
};

describe("PV do companheiro", () => {
  it("o PV temporário absorve o dano primeiro", () => {
    const damaged = applyCompanionDamage({ ...hound, temp: 5 }, 30, 12);
    expect([damaged.damage, damaged.temp]).toEqual([7, 0]);
  });

  it("com 0 PV fica caído, sem passar do máximo", () => {
    const owner = createSheetDocument("Brann");
    const damaged = applyCompanionDamage({ ...hound, damage: 7 }, 30, 40);
    expect(damaged.damage).toBe(30);
    const stats = deriveCompanion(damaged, deriveStats(owner));
    expect([stats.hitPointsCurrent, stats.down]).toEqual([0, true]);
    expect(owner.deathSaves).toEqual({ successes: 0, failures: 0 });
  });

  it("a cura com o máximo menor que o dano conta a partir de 0", () => {
    expect(applyCompanionHealing({ ...hound, damage: 45 }, 25, 5).damage).toBe(
      20,
    );
    expect(applyCompanionHealing({ ...hound, damage: 3 }, 30, 10).damage).toBe(
      0,
    );
  });

  it("trocar o círculo de 4 para 2 com 10 de dano dá 15/25", () => {
    const owner = deriveStats(createSheetDocument("Elara"));
    const steed: Companion = {
      ...createCompanion("c3"),
      summon: { enabled: true, minLevel: 2, level: 4 },
      hitPointsMax: "5 + 10 * circulo",
      damage: 10,
    };
    expect(deriveCompanion(steed, owner).hitPointsCurrent).toBe(35);
    const lower = { ...steed, summon: { ...steed.summon, level: 2 } };
    const stats = deriveCompanion(lower, owner);
    expect([stats.hitPointsCurrent, stats.hitPointsMax.value]).toEqual([
      15, 25,
    ]);
  });

  it("o PV temporário fica entre 0 e 999", () => {
    expect(setCompanionTemp(hound, -3).temp).toBe(0);
    expect(setCompanionTemp(hound, 1200).temp).toBe(999);
  });
});

describe("dados de vida do companheiro", () => {
  it("não passam de 0 disponíveis nem do total", () => {
    const spent = spendCompanionHitDie({ ...hound, hitDiceSpent: 4 }, 5);
    expect(spent.hitDiceSpent).toBe(5);
    expect(spendCompanionHitDie(spent, 5).hitDiceSpent).toBe(5);
    expect(recoverCompanionHitDie(hound).hitDiceSpent).toBe(0);
    expect(recoverCompanionHitDie(spent).hitDiceSpent).toBe(4);
  });
});

describe("condições do companheiro", () => {
  it("marca e desmarca", () => {
    const frightened = toggleCompanionCondition(hound, "frightened");
    expect(frightened.conditions).toEqual(["frightened"]);
    expect(
      toggleCompanionCondition(frightened, "frightened").conditions,
    ).toEqual([]);
  });
});
