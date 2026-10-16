import type { ExpressionVariables } from "@/engine/effects/expression";
import type { SheetDocument } from "@/engine/sheet/document";

import { rechargeUsed, trackerMax } from "./trackers";

/*
 * Descansos (design R2): funções puras sobre o documento. Cada tracker aplica
 * a regra do descanso feito; espaços recarregam por inteiro.
 */

function recharge(
  document: SheetDocument,
  rest: "shortRest" | "longRest",
  variables: ExpressionVariables,
): SheetDocument["sources"] {
  return document.sources.map((source) => ({
    ...source,
    trackers: source.trackers.map((tracker) => {
      const { max } = trackerMax(tracker, variables);
      return {
        ...tracker,
        used: rechargeUsed(tracker.used, max, tracker[rest], variables),
      };
    }),
  })) as SheetDocument["sources"];
}

/** Regra de descanso curto de cada tracker e a Magia de Pacto. */
export function shortRest(
  document: SheetDocument,
  variables: ExpressionVariables,
): SheetDocument {
  return {
    ...document,
    sources: recharge(document, "shortRest", variables),
    pactSlots: { ...document.pactSlots, used: 0 },
  };
}

/**
 * Regra de descanso longo de cada tracker, todos os espaços e a regra do
 * 5.5e: PV ao máximo, sem PV temporário, todos os dados de vida, testes
 * contra a morte zerados e 1 nível de Exaustão a menos. As condições ativas
 * ficam como estão (design T8).
 */
export function longRest(
  document: SheetDocument,
  variables: ExpressionVariables,
): SheetDocument {
  return {
    ...document,
    sources: recharge(document, "longRest", variables),
    spellSlots: document.spellSlots.map((slot) => ({ ...slot, used: 0 })),
    pactSlots: { ...document.pactSlots, used: 0 },
    hitPoints: { ...document.hitPoints, damage: 0, temp: 0, hitDiceSpent: 0 },
    deathSaves: { successes: 0, failures: 0 },
    exhaustion: Math.max(0, document.exhaustion - 1),
  };
}
