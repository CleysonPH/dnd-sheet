import type { ActionLine, DamageTerm } from "@/engine/attacks/derive";
import type {
  Action,
  ActionAbility,
  ActionProficiency,
  ActionRange,
  ActionResolution,
  PartAbility,
  PartType,
} from "@/engine/attacks/schema";
import { ABILITIES } from "@/engine/stats/keys";

import { ABILITY_LABEL, DAMAGE_TYPE_LABEL } from "../labels";
import { formatSigned } from "../parse";

/*
 * Rótulos e formatação das ações (design G8). O motor devolve números e
 * dados estruturados; o texto em português fica aqui.
 */

export const RESOLUTION_LABEL: Record<ActionResolution, string> = {
  attack: "Ataque",
  save: "Salvaguarda",
  auto: "Automática",
};

export const RANGE_LABEL: Record<ActionRange, string> = {
  melee: "Corpo a corpo",
  ranged: "À distância",
};

export const ACTION_PROFICIENCY_LABEL: Record<ActionProficiency, string> = {
  auto: "Automática",
  always: "Sempre",
  never: "Nunca",
};

export const ACTION_ABILITY_LABEL: Record<PartAbility, string> = {
  ...(Object.fromEntries(
    ABILITIES.map((ability) => [ability, ABILITY_LABEL[ability].name]),
  ) as Record<(typeof ABILITIES)[number], string>),
  none: "Nenhum",
  finesse: "Acuidade (FOR ou DES)",
  spellcasting: "Conjuração",
  attack: "O do ataque",
};

export const SAVE_OUTCOME_LABEL: Record<Action["onSuccess"], string> = {
  none: "Nada",
  half: "Metade do dano",
};

export const PART_TYPE_LABEL: Record<PartType, string> = {
  ...DAMAGE_TYPE_LABEL,
  healing: "cura",
  tempHp: "PV temporários",
};

/** "1d8+3", "1d4-1", "2d8" ou só o número, quando não há dados. */
export function formatDice(
  term: Pick<DamageTerm, "count" | "die" | "modifier">,
) {
  if (term.count === 0) return String(term.modifier);
  const modifier = term.modifier === 0 ? "" : formatSigned(term.modifier);
  return `${term.count}${term.die}${modifier}`;
}

/** "8d6 fogo (+1d6/círculo)". */
export function formatTerm(term: DamageTerm): string {
  const upcast = term.upcast > 0 ? ` (+${term.upcast}${term.die}/círculo)` : "";
  return `${formatDice(term)} ${PART_TYPE_LABEL[term.type]}${upcast}`;
}

/** "1d4+4 concussão + 2d8 trovejante". */
export function formatDamage(parts: readonly DamageTerm[]): string {
  return parts.map(formatTerm).join(" + ");
}

/** "+7", "SAB CD 15" ou vazio, numa ação automática. */
export function formatCheck(line: ActionLine): string {
  if (line.toHit) return formatSigned(line.toHit.value);
  if (line.dc && line.saveAbility) {
    return `${ABILITY_LABEL[line.saveAbility].short} CD ${line.dc.value}`;
  }
  return "";
}

/** Nome da linha: "Machado de Batalha · Uma mão" ou só o da fonte. */
export function lineName(line: ActionLine): string {
  return line.name ? `${line.sourceName} · ${line.name}` : line.sourceName;
}

/** "×2 · +7 · 1d10 energia · metade no sucesso", para os cartões. */
export function describeLine(line: ActionLine): string {
  return [
    line.attacks > 1 ? `×${line.attacks}` : "",
    formatCheck(line),
    formatDamage(line.parts),
    line.onSuccess === "half" ? "metade no sucesso" : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

export function actionAbilityOptions<A extends ActionAbility | PartAbility>(
  abilities: readonly A[],
) {
  return abilities.map(
    (ability) => [ability, ACTION_ABILITY_LABEL[ability]] as const,
  );
}
