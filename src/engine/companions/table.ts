import { damageState, healedDamage } from "@/engine/stats/hit-points";
import type { ActiveCondition } from "@/engine/traits/keys";

import type { Companion } from "./schema";

/*
 * Estado de mesa do companheiro (design H5): dano, cura, PV temporário,
 * dados de vida e condições. Sem testes contra a morte nem concentração.
 * `max` é o valor calculado por deriveCompanion.
 */

export function applyCompanionDamage(
  companion: Companion,
  max: number,
  amount: number,
): Companion {
  return { ...companion, ...damageState(companion, max, amount) };
}

export function applyCompanionHealing(
  companion: Companion,
  max: number,
  amount: number,
): Companion {
  return { ...companion, damage: healedDamage(companion.damage, max, amount) };
}

export function setCompanionTemp(
  companion: Companion,
  temp: number,
): Companion {
  return { ...companion, temp: Math.min(999, Math.max(0, temp)) };
}

/** Gasta um dado de vida, sem passar de 0 disponíveis. */
export function spendCompanionHitDie(
  companion: Companion,
  max: number,
): Companion {
  if (companion.hitDiceSpent >= max) return companion;
  return { ...companion, hitDiceSpent: companion.hitDiceSpent + 1 };
}

/** Recupera um dado de vida gasto, sem passar do total. */
export function recoverCompanionHitDie(companion: Companion): Companion {
  if (companion.hitDiceSpent <= 0) return companion;
  return { ...companion, hitDiceSpent: companion.hitDiceSpent - 1 };
}

export function toggleCompanionCondition(
  companion: Companion,
  condition: ActiveCondition,
): Companion {
  const conditions = companion.conditions.includes(condition)
    ? companion.conditions.filter((entry) => entry !== condition)
    : [...companion.conditions, condition];
  return { ...companion, conditions };
}
