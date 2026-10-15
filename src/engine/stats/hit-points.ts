import { z } from "zod";

import type { SheetDocument } from "@/engine/sheet/document";

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

/**
 * O PV temporário absorve o dano primeiro; o resto vira dano sofrido, que
 * não passa do PV máximo (o PV atual não fica abaixo de 0).
 */
export function applyDamage(
  document: SheetDocument,
  amount: number,
): SheetDocument {
  const { temp, damage } = document.hitPoints;
  const absorbed = Math.min(temp, amount);
  const max = hitPointsMax(document);
  return {
    ...document,
    hitPoints: {
      ...document.hitPoints,
      temp: temp - absorbed,
      damage: Math.min(max, damage + amount - absorbed),
    },
  };
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
  const damage = Math.min(document.hitPoints.damage, hitPointsMax(document));
  return {
    ...document,
    hitPoints: { ...document.hitPoints, damage: Math.max(0, damage - amount) },
  };
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
