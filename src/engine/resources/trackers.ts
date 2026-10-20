import {
  EvaluationError,
  evaluate,
  parseExpressionCached,
  scopeOf,
  type ExpressionVariables,
} from "@/engine/effects/expression";
import type { SheetDocument } from "@/engine/sheet/document";

import type { Recharge, Tracker } from "./schema";

/*
 * Trackers e contadores de recursos (design R2). O documento guarda o
 * "usado"; o atual é o máximo menos o usado, sem ficar abaixo de 0.
 */

export type ResolvedTracker = {
  sourceId: string;
  sourceName: string;
  tracker: Tracker;
  max: number;
  current: number;
  /** Erro ao avaliar o máximo (o máximo vale 0). */
  error?: string;
};

/** Máximo do tracker: negativo ou com erro vale 0. */
export function trackerMax(
  tracker: Tracker,
  variables: ExpressionVariables,
): { max: number; error?: string } {
  const parsed = parseExpressionCached(tracker.max, scopeOf(variables));
  if (!parsed.ok) return { max: 0, error: parsed.error };
  try {
    return { max: Math.max(0, evaluate(parsed.expression, variables)) };
  } catch (error) {
    if (!(error instanceof EvaluationError)) throw error;
    return { max: 0, error: error.message };
  }
}

/** Atual a partir do máximo e do usado. */
export function currentOf(max: number, used: number): number {
  return Math.max(0, max - used);
}

/** Avalia uma expressão de quantidade: negativa ou com erro vale 0. */
function amountOf(text: string, variables: ExpressionVariables): number {
  const parsed = parseExpressionCached(text, scopeOf(variables));
  if (!parsed.ok) return 0;
  try {
    return Math.max(0, evaluate(parsed.expression, variables));
  } catch (error) {
    if (!(error instanceof EvaluationError)) throw error;
    return 0;
  }
}

/**
 * Aplica a regra de um descanso ao usado (design R2): "all" zera; "amount"
 * recupera a quantidade sem passar do máximo; "none" não muda.
 */
export function rechargeUsed(
  used: number,
  max: number,
  rule: Recharge,
  variables: ExpressionVariables,
): number {
  switch (rule.mode) {
    case "none":
      return used;
    case "all":
      return 0;
    case "amount":
      return Math.max(
        0,
        Math.min(used, max) - amountOf(rule.amount, variables),
      );
  }
}

/** Todos os trackers das fontes, ativas ou não, na ordem da ficha. */
export function resolveTrackers(
  document: SheetDocument,
  variables: ExpressionVariables,
): ResolvedTracker[] {
  return document.sources.flatMap((source) =>
    source.trackers.map((tracker) => {
      const { max, error } = trackerMax(tracker, variables);
      return {
        sourceId: source.id,
        sourceName: source.name,
        tracker,
        max,
        current: currentOf(max, tracker.used),
        ...(error ? { error } : {}),
      };
    }),
  );
}

/** Gasta 1: o usado sobe, se ainda houver atual. */
export function spend(used: number, max: number): number {
  return currentOf(max, used) > 0 ? used + 1 : used;
}

/**
 * Recupera 1: o usado desce, sem passar de 0. Usado acima do máximo parte
 * do máximo, como na cura (o máximo caiu depois do gasto).
 */
export function recover(used: number, max: number): number {
  return Math.max(0, Math.min(used, max) - 1);
}
