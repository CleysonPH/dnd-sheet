import { describe, expect, it } from "vitest";

import {
  createSheetDocument,
  type SheetDocument,
} from "@/engine/sheet/document";
import { createSource } from "@/engine/sources/rules";
import { deriveStats } from "@/engine/stats/derive";

import { longRest, shortRest } from "./rest";
import {
  createTracker,
  emptySpellSlots,
  type Recharge,
  type Tracker,
} from "./schema";
import { resolveTrackers } from "./trackers";

const none: Recharge = { mode: "none", amount: "1" };
const all: Recharge = { mode: "all", amount: "1" };
const amount = (text: string): Recharge => ({ mode: "amount", amount: text });

function withTrackers(
  doc: SheetDocument,
  trackers: Partial<Tracker>[],
): SheetDocument {
  return {
    ...doc,
    sources: [
      {
        ...createSource("trait", "Recursos", "s1"),
        trackers: trackers.map((tracker, i) => ({
          ...createTracker(`t${i}`),
          ...tracker,
        })),
      },
    ],
  };
}

const vars = (doc: SheetDocument) => deriveStats(doc).variables;
const rest = (fn: typeof shortRest, doc: SheetDocument) => fn(doc, vars(doc));

function trackerState(doc: SheetDocument) {
  return resolveTrackers(doc, vars(doc)).map(
    (t) => `${t.tracker.name} ${t.current}/${t.max}`,
  );
}

/** Kai, monge nível 3: 0 de 3 Pontos de Foco, 0 de 2 espaços de 1º. */
function kai(): SheetDocument {
  const doc = createSheetDocument("Kai");
  const spellSlots = emptySpellSlots();
  spellSlots[0] = { max: 2, used: 2 };
  return withTrackers(
    {
      ...doc,
      identity: { ...doc.identity, level: 3 },
      spellSlots,
      pactSlots: { level: 2, max: 2, used: 2 },
    },
    [
      {
        name: "Pontos de Foco",
        max: "nivel",
        used: 3,
        shortRest: all,
        longRest: all,
      },
    ],
  );
}

/** Ária, bardo nível 5 com CAR 16: 0 de 3 Inspirações (curto: 1, longo: tudo). */
function aria(used = 3): SheetDocument {
  const doc = createSheetDocument("Ária");
  return withTrackers(
    {
      ...doc,
      identity: { ...doc.identity, level: 5 },
      abilities: { ...doc.abilities, cha: 16 },
    },
    [
      {
        name: "Inspiração",
        max: "max(1, car.mod)",
        used,
        shortRest: amount("1"),
        longRest: all,
      },
    ],
  );
}

/** Thorin: 40/55 PV, 5 temporários, 3/5 dados de vida, 0/3 Fúrias. */
function thorin(): SheetDocument {
  const doc = createSheetDocument("Thorin");
  return withTrackers(
    {
      ...doc,
      identity: { ...doc.identity, level: 5 },
      abilities: { ...doc.abilities, con: 16 },
      hitPoints: { hitDie: 12, damage: 15, temp: 5, hitDiceSpent: 2 },
      deathSaves: { successes: 1, failures: 1 },
    },
    [
      {
        name: "Fúria",
        max: "3",
        used: 3,
        shortRest: amount("1"),
        longRest: all,
      },
      { name: "Cargas", max: "7", used: 5, shortRest: none, longRest: none },
    ],
  );
}

describe("shortRest", () => {
  it("recarrega os Pontos de Foco de Kai e mantém os espaços de 1º", () => {
    const rested = rest(shortRest, kai());
    expect(trackerState(rested)).toEqual(["Pontos de Foco 3/3"]);
    expect(rested.spellSlots[0]).toEqual({ max: 2, used: 2 });
  });

  it("recupera a Magia de Pacto", () => {
    expect(rest(shortRest, kai()).pactSlots).toEqual({
      level: 2,
      max: 2,
      used: 0,
    });
  });

  it("Inspiração de Ária: 0/3 vira 1/3", () => {
    expect(trackerState(rest(shortRest, aria()))).toEqual(["Inspiração 1/3"]);
  });

  it("a quantidade não passa do máximo", () => {
    const doc = withTrackers(createSheetDocument("X"), [
      { name: "Usos", max: "3", used: 1, shortRest: amount("2") },
    ]);
    expect(trackerState(rest(shortRest, doc))).toEqual(["Usos 3/3"]);
  });

  it("quantidade com erro não recupera nada", () => {
    const doc = withTrackers(createSheetDocument("X"), [
      { name: "Usos", max: "3", used: 3, shortRest: amount("1 / 0") },
    ]);
    expect(trackerState(rest(shortRest, doc))).toEqual(["Usos 0/3"]);
  });

  it("não mexe em PV; Fúria recupera 1 e Cargas nada", () => {
    const rested = rest(shortRest, thorin());
    expect(rested.hitPoints).toEqual(thorin().hitPoints);
    expect(trackerState(rested)).toEqual(["Fúria 1/3", "Cargas 2/7"]);
  });
});

describe("longRest", () => {
  it("Thorin: 55/55, sem temporário, 5/5 dados, Fúria 3/3, Cargas 2/7", () => {
    const rested = rest(longRest, thorin());
    const stats = deriveStats(rested);
    expect(stats.hitPointsCurrent).toBe(55);
    expect(rested.hitPoints.temp).toBe(0);
    expect(stats.hitDiceAvailable).toBe(5);
    expect(rested.deathSaves).toEqual({ successes: 0, failures: 0 });
    expect(trackerState(rested)).toEqual(["Fúria 3/3", "Cargas 2/7"]);
  });

  it("Inspiração de Ária volta a 3/3", () => {
    expect(trackerState(rest(longRest, aria()))).toEqual(["Inspiração 3/3"]);
  });

  it("Exaustão 2 e envenenado: Exaustão 1 e continua envenenado", () => {
    const tired: SheetDocument = {
      ...thorin(),
      exhaustion: 2,
      conditions: ["poisoned"],
    };
    const rested = rest(longRest, tired);
    expect(rested.exhaustion).toBe(1);
    expect(rested.conditions).toEqual(["poisoned"]);
    expect(rest(longRest, thorin()).exhaustion).toBe(0);
  });

  it("o descanso curto não mexe na Exaustão", () => {
    expect(rest(shortRest, { ...thorin(), exhaustion: 2 }).exhaustion).toBe(2);
  });

  it("recupera todos os espaços", () => {
    const rested = rest(longRest, kai());
    expect(rested.spellSlots[0]).toEqual({ max: 2, used: 0 });
    expect(rested.pactSlots.used).toBe(0);
  });
});
