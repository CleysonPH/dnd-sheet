import { companionVariables } from "@/engine/companions/derive";
import type { Companion } from "@/engine/companions/schema";
import type { ExpressionVariables } from "@/engine/effects/expression";
import type { SheetDocument } from "@/engine/sheet/document";
import type { DerivedStats } from "@/engine/stats/derive";

import type { Tracker } from "./schema";
import { rechargeUsed, trackerMax } from "./trackers";

/*
 * Descansos (design R2, H6): funções puras sobre o documento. Cada tracker
 * aplica a regra do descanso feito; espaços recarregam por inteiro. Os usos
 * dos companheiros seguem a mesma regra, com as variáveis de cada um.
 */

type Rest = "shortRest" | "longRest";

function rechargeTrackers(
  trackers: readonly Tracker[],
  rest: Rest,
  variables: ExpressionVariables,
): Tracker[] {
  return trackers.map((tracker) => {
    const { max } = trackerMax(tracker, variables);
    return {
      ...tracker,
      used: rechargeUsed(tracker.used, max, tracker[rest], variables),
    };
  });
}

function recharge(
  document: SheetDocument,
  rest: Rest,
  variables: ExpressionVariables,
): SheetDocument["sources"] {
  return document.sources.map((source) => ({
    ...source,
    trackers: rechargeTrackers(source.trackers, rest, variables),
  })) as SheetDocument["sources"];
}

function rechargeCompanion(
  companion: Companion,
  rest: Rest,
  stats: DerivedStats,
): Companion {
  return {
    ...companion,
    trackers: rechargeTrackers(
      companion.trackers,
      rest,
      companionVariables(companion, stats),
    ),
  };
}

/**
 * Regra de descanso curto de cada tracker, dos usos dos companheiros e a
 * Magia de Pacto.
 */
export function shortRest(
  document: SheetDocument,
  stats: DerivedStats,
): SheetDocument {
  return {
    ...document,
    sources: recharge(document, "shortRest", stats.variables),
    pactSlots: { ...document.pactSlots, used: 0 },
    companions: document.companions.map((companion) =>
      rechargeCompanion(companion, "shortRest", stats),
    ),
  };
}

/**
 * Regra de descanso longo de cada tracker, todos os espaços e a regra do
 * 5.5e: PV ao máximo, sem PV temporário, todos os dados de vida, testes
 * contra a morte zerados e 1 nível de Exaustão a menos. Os companheiros
 * recuperam os usos, o PV e os dados de vida. As condições ativas ficam como
 * estão (design T8).
 */
export function longRest(
  document: SheetDocument,
  stats: DerivedStats,
): SheetDocument {
  return {
    ...document,
    sources: recharge(document, "longRest", stats.variables),
    spellSlots: document.spellSlots.map((slot) => ({ ...slot, used: 0 })),
    pactSlots: { ...document.pactSlots, used: 0 },
    hitPoints: { ...document.hitPoints, damage: 0, temp: 0, hitDiceSpent: 0 },
    deathSaves: { successes: 0, failures: 0 },
    exhaustion: Math.max(0, document.exhaustion - 1),
    companions: document.companions.map((companion) => ({
      ...rechargeCompanion(companion, "longRest", stats),
      damage: 0,
      temp: 0,
      hitDiceSpent: 0,
    })),
  };
}
