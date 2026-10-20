import { z } from "zod";

import type { SheetDocument } from "@/engine/sheet/document";

import { endConcentration } from "./concentration";
import { deriveStats } from "./derive";

/*
 * Dano, cura e testes contra a morte (design V3). Funções puras sobre o
 * documento; o PV máximo é sempre o efetivo, já com override.
 */

const AMOUNT_MESSAGE = "A quantidade vai de 1 a 999";

/** Quantidade de dano ou de cura aplicada de uma vez. */
export const hitPointsAmountSchema = z
  .number(AMOUNT_MESSAGE)
  .int(AMOUNT_MESSAGE)
  .min(1, AMOUNT_MESSAGE)
  .max(999, AMOUNT_MESSAGE);

function hitPointsMax(document: SheetDocument): number {
  return deriveStats(document).values.hitPointsMax.value;
}

type HitPointsState = { damage: number; temp: number };

/**
 * Regra do dano, comum ao personagem e ao companheiro (design H5): o PV
 * temporário absorve primeiro e o dano não passa do máximo.
 */
export function damageState(
  state: HitPointsState,
  max: number,
  amount: number,
): HitPointsState {
  const absorbed = Math.min(state.temp, amount);
  return {
    temp: state.temp - absorbed,
    damage: Math.min(max, state.damage + amount - absorbed),
  };
}

/** Regra da cura: o dano é limitado ao máximo antes de subtrair. */
export function healedDamage(
  damage: number,
  max: number,
  amount: number,
): number {
  return Math.max(0, Math.min(damage, max) - amount);
}

/**
 * O PV temporário absorve o dano primeiro; o resto vira dano sofrido, que
 * não passa do PV máximo (o PV atual não fica abaixo de 0). Chegar a 0 PV
 * encerra a concentração (design I3).
 */
export function applyDamage(
  document: SheetDocument,
  amount: number,
): SheetDocument {
  const damaged = {
    ...document,
    hitPoints: {
      ...document.hitPoints,
      ...damageState(document.hitPoints, hitPointsMax(document), amount),
    },
  };
  return deriveStats(damaged).hitPointsCurrent === 0
    ? endConcentration(damaged)
    : damaged;
}

/**
 * Recupera PV até o máximo, sem mexer no temporário. O dano é limitado ao
 * máximo antes de subtrair, para que a cura de quem está com 0 PV conte a
 * partir de 0 mesmo se o máximo caiu abaixo do dano guardado.
 */
export function applyHealing(
  document: SheetDocument,
  amount: number,
): SheetDocument {
  const damage = healedDamage(
    document.hitPoints.damage,
    hitPointsMax(document),
    amount,
  );
  return { ...document, hitPoints: { ...document.hitPoints, damage } };
}

/**
 * Com PV atual acima de 0, os testes contra a morte ficam zerados (regra do
 * 5.5e). Aplicada a toda edição da ficha, qualquer que seja a causa.
 */
export function normalizeDeathSaves(document: SheetDocument): SheetDocument {
  const { successes, failures } = document.deathSaves;
  if (successes === 0 && failures === 0) return document;
  if (deriveStats(document).hitPointsCurrent === 0) return document;
  return { ...document, deathSaves: { successes: 0, failures: 0 } };
}
