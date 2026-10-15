import { abilityModifier } from "@/engine/abilities";
import type { SheetDocument } from "@/engine/sheet/document";

import {
  ABILITIES,
  PROFICIENCY_MULTIPLIER,
  SKILLS,
  SKILL_ABILITY,
  proficiencyBonusForLevel,
  type DerivedKey,
} from "./keys";

/** Um valor derivado: o que vale, o que o cálculo daria e se há override. */
export type DerivedValue = {
  value: number;
  calculated: number;
  overridden: boolean;
};

export type DerivedStats = {
  values: Record<DerivedKey, DerivedValue>;
  /** PV máximo menos o dano sofrido, sem passar de 0 (design S3). */
  hitPointsCurrent: number;
  /** Total de dados de vida menos os gastos, sem passar de 0. */
  hitDiceAvailable: number;
};

/** PV máximo pela média fixa do 5.5e, com mínimo de 1 PV por nível. */
export function hitPointsMaxFor(
  hitDie: number,
  level: number,
  conModifier: number,
): number {
  const first = Math.max(1, hitDie + conModifier);
  const perLevel = Math.max(1, hitDie / 2 + 1 + conModifier);
  return first + (level - 1) * perLevel;
}

/**
 * Valores derivados da ficha (design S4). A ordem é fixa: cada valor passa
 * pelo override antes de ser lido pelos valores que dependem dele.
 */
export function deriveStats(document: SheetDocument): DerivedStats {
  const values = {} as Record<DerivedKey, DerivedValue>;

  function resolve(key: DerivedKey, calculated: number): number {
    const manual = document.overrides[key];
    const overridden = manual !== undefined;
    const value = overridden ? manual : calculated;
    values[key] = { value, calculated, overridden };
    return value;
  }

  const mod = Object.fromEntries(
    ABILITIES.map((ability) => [
      ability,
      resolve(`mod.${ability}`, abilityModifier(document.abilities[ability])),
    ]),
  ) as Record<(typeof ABILITIES)[number], number>;

  const { level } = document.identity;
  const pb = resolve("proficiencyBonus", proficiencyBonusForLevel(level));

  for (const ability of ABILITIES) {
    const proficient = document.savingThrows[ability];
    resolve(`save.${ability}`, mod[ability] + (proficient ? pb : 0));
  }

  for (const skill of SKILLS) {
    const multiplier = PROFICIENCY_MULTIPLIER[document.skills[skill]];
    resolve(`skill.${skill}`, mod[SKILL_ABILITY[skill]] + multiplier * pb);
  }

  resolve("initiative", mod.dex);
  resolve("passivePerception", 10 + values["skill.perception"].value);

  const { hitDie, damage, hitDiceSpent } = document.hitPoints;
  const hitPointsMax = resolve(
    "hitPointsMax",
    hitPointsMaxFor(hitDie, level, mod.con),
  );
  const hitDiceMax = resolve("hitDiceMax", level);

  return {
    values,
    hitPointsCurrent: Math.max(0, hitPointsMax - damage),
    hitDiceAvailable: Math.max(0, hitDiceMax - hitDiceSpent),
  };
}
