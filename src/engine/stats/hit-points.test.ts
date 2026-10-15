import { describe, expect, it } from "vitest";

import {
  createSheetDocument,
  type SheetDocument,
} from "@/engine/sheet/document";

import { createSource } from "@/engine/sources/rules";

import { concentratingSpell } from "./concentration";
import { deriveStats } from "./derive";
import { applyDamage, applyHealing, normalizeDeathSaves } from "./hit-points";

/** Thorin, nível 5 com d12 e CON 16: 55 PV máximos. */
function thorin(
  patch: {
    level?: number;
    damage?: number;
    temp?: number;
    deathSaves?: SheetDocument["deathSaves"];
    overrides?: SheetDocument["overrides"];
  } = {},
): SheetDocument {
  const base = createSheetDocument("Thorin");
  return {
    ...base,
    identity: { ...base.identity, level: patch.level ?? 5 },
    abilities: { ...base.abilities, con: 16 },
    hitPoints: {
      ...base.hitPoints,
      hitDie: 12,
      damage: patch.damage ?? 0,
      temp: patch.temp ?? 0,
    },
    deathSaves: patch.deathSaves ?? base.deathSaves,
    overrides: patch.overrides ?? {},
  };
}

function hp(document: SheetDocument) {
  const stats = deriveStats(document);
  return {
    current: stats.hitPointsCurrent,
    max: stats.values.hitPointsMax.value,
    temp: document.hitPoints.temp,
  };
}

describe("applyDamage", () => {
  /** Com "Escudo da Fé", de concentração, em efeito. */
  const concentrating = (damage: number): SheetDocument => ({
    ...thorin({ damage }),
    sources: [
      {
        ...createSource("spell", "Escudo da Fé", "s1"),
        level: 1,
        concentration: true,
        active: true,
      },
    ],
  });

  it("cair a 0 PV encerra a concentração", () => {
    const document = applyDamage(concentrating(43), 20);
    expect(hp(document).current).toBe(0);
    expect(concentratingSpell(document.sources)).toBeNull();
  });

  it("acima de 0 PV, a concentração continua", () => {
    const document = applyDamage(concentrating(25), 20);
    expect(hp(document).current).toBe(10);
    expect(concentratingSpell(document.sources)?.name).toBe("Escudo da Fé");
  });

  it("o PV temporário absorve primeiro: 40/55 temp 5, 7 de dano -> 38/55 temp 0", () => {
    const document = applyDamage(thorin({ damage: 15, temp: 5 }), 7);
    expect(hp(document)).toEqual({ current: 38, max: 55, temp: 0 });
  });

  it("dano menor que o temporário só gasta o temporário", () => {
    const document = applyDamage(thorin({ damage: 15, temp: 5 }), 3);
    expect(hp(document)).toEqual({ current: 40, max: 55, temp: 2 });
  });

  it("dano maior que o PV atual para em 0", () => {
    const document = applyDamage(thorin({ damage: 17 }), 100);
    expect(hp(document)).toEqual({ current: 0, max: 55, temp: 0 });
    expect(document.hitPoints.damage).toBe(55);
  });

  it("usa o PV máximo manual: 61/61 com 10 de dano -> 51/61", () => {
    const document = applyDamage(
      thorin({ overrides: { hitPointsMax: 61 } }),
      10,
    );
    expect(hp(document)).toEqual({ current: 51, max: 61, temp: 0 });
  });
});

describe("applyHealing", () => {
  it("cura até o máximo sem mexer no temporário: 38/55 temp 3, 20 de cura -> 55/55", () => {
    const document = applyHealing(thorin({ damage: 17, temp: 3 }), 20);
    expect(hp(document)).toEqual({ current: 55, max: 55, temp: 3 });
  });

  it("cura parcial", () => {
    expect(hp(applyHealing(thorin({ damage: 55 }), 4)).current).toBe(4);
  });

  it("com o máximo abaixo do dano guardado, cura a partir de 0", () => {
    // Dano 55 guardado, mas o máximo é 45 (override): o atual é 0.
    const document = thorin({ damage: 55, overrides: { hitPointsMax: 45 } });
    expect(hp(document).current).toBe(0);
    expect(hp(applyHealing(document, 4)).current).toBe(4);
  });
});

describe("normalizeDeathSaves", () => {
  const marked = { successes: 2, failures: 1 };

  it("mantém os testes com 0 PV", () => {
    const document = thorin({ damage: 55, deathSaves: marked });
    expect(normalizeDeathSaves(document).deathSaves).toEqual(marked);
  });

  it("zera os testes depois de uma cura que tira de 0", () => {
    const healed = applyHealing(thorin({ damage: 55, deathSaves: marked }), 4);
    expect(normalizeDeathSaves(healed).deathSaves).toEqual({
      successes: 0,
      failures: 0,
    });
  });

  it("zera ao subir de nível com 0 PV: 0/55 vira 10/65", () => {
    const leveled = thorin({
      level: 6,
      damage: 55,
      deathSaves: { successes: 0, failures: 1 },
    });
    expect(hp(leveled)).toEqual({ current: 10, max: 65, temp: 0 });
    expect(normalizeDeathSaves(leveled).deathSaves).toEqual({
      successes: 0,
      failures: 0,
    });
  });

  it("devolve o mesmo documento quando não há o que mudar", () => {
    const document = thorin({ damage: 15 });
    expect(normalizeDeathSaves(document)).toBe(document);
  });
});
