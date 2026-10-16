import {
  ABILITIES,
  SKILLS,
  type Ability,
  type Skill,
} from "@/engine/stats/keys";
import {
  ARMOR_PROFICIENCIES,
  CONDITIONS,
  DAMAGE_TYPES,
  MAX_TAG_LENGTH,
  WEAPON_CATEGORIES,
} from "@/engine/traits/keys";

/*
 * Alvos e operações dos efeitos (design E2). A lista é fechada: o jogador
 * escolhe numa lista, não digita.
 */

export const EFFECT_OPERATIONS = [
  "add",
  "altBase",
  "set",
  "proficiency",
  "grant",
] as const;
export type EffectOperation = (typeof EFFECT_OPERATIONS)[number];

export const EFFECT_PROFICIENCIES = [
  "half",
  "proficient",
  "expertise",
] as const;
export type EffectProficiency = (typeof EFFECT_PROFICIENCIES)[number];

/** Multiplicador do bônus de proficiência de cada nível dado por efeito. */
export const EFFECT_PROFICIENCY_MULTIPLIER: Record<EffectProficiency, number> =
  { half: 0.5, proficient: 1, expertise: 2 };

export type EffectTarget =
  | `ability.${Ability}`
  | `save.${Ability}`
  | "save.all"
  | `skill.${Skill}`
  | "skill.all"
  | "armorClass"
  | "speed"
  | "initiative"
  | "hitPointsMax"
  | "passivePerception"
  | "spellSaveDc"
  | "spellAttack"
  | GrantTarget;

/** Alvos de "conceder": listas de proficiências e de defesas (design T1). */
export const GRANT_TARGETS = [
  "proficiency.armor",
  "proficiency.weapon",
  "proficiency.tool",
  "language",
  "defense.resistance",
  "defense.immunity",
  "defense.vulnerability",
  "defense.conditionImmunity",
] as const;
export type GrantTarget = (typeof GRANT_TARGETS)[number];

export function isGrantTarget(target: EffectTarget): target is GrantTarget {
  return (GRANT_TARGETS as readonly string[]).includes(target);
}

/**
 * Valores fechados de cada alvo de "conceder"; `free` diz se o alvo aceita
 * também um texto livre (armas específicas, ferramentas, idiomas).
 */
export const GRANT_VALUES: Record<
  GrantTarget,
  { values: readonly string[]; free: boolean }
> = {
  "proficiency.armor": { values: ARMOR_PROFICIENCIES, free: false },
  "proficiency.weapon": { values: WEAPON_CATEGORIES, free: true },
  "proficiency.tool": { values: [], free: true },
  language: { values: [], free: true },
  "defense.resistance": { values: DAMAGE_TYPES, free: false },
  "defense.immunity": { values: DAMAGE_TYPES, free: false },
  "defense.vulnerability": { values: DAMAGE_TYPES, free: false },
  "defense.conditionImmunity": { values: CONDITIONS, free: false },
};

/** Motivo de o valor não servir ao alvo, ou null se servir. */
export function grantValueError(
  target: GrantTarget,
  value: string,
): string | null {
  const { values, free } = GRANT_VALUES[target];
  if (values.includes(value)) return null;
  if (!free) return "Escolha um item da lista";
  const text = value.trim();
  if (text.length === 0) return "Informe um nome";
  if (text.length > MAX_TAG_LENGTH) {
    return `Use no máximo ${MAX_TAG_LENGTH} caracteres`;
  }
  return null;
}

export const EFFECT_TARGETS = [
  ...ABILITIES.map((ability) => `ability.${ability}` as const),
  ...ABILITIES.map((ability) => `save.${ability}` as const),
  "save.all",
  ...SKILLS.map((skill) => `skill.${skill}` as const),
  "skill.all",
  "armorClass",
  "speed",
  "initiative",
  "hitPointsMax",
  "passivePerception",
  "spellSaveDc",
  "spellAttack",
  ...GRANT_TARGETS,
] as const satisfies readonly EffectTarget[];

/** Operações aceitas por alvo. */
export function operationsFor(
  target: EffectTarget,
): readonly EffectOperation[] {
  if (isGrantTarget(target)) return ["grant"];
  if (target.startsWith("ability.")) return ["add", "set"];
  if (target.startsWith("save.") || target.startsWith("skill.")) {
    return ["add", "proficiency"];
  }
  if (target === "armorClass") return ["add", "altBase"];
  if (target === "speed") return ["add", "set"];
  return ["add"];
}

/**
 * Operações que usam a expressão (proficiência usa o nível escolhido, e
 * conceder, o valor).
 */
export function usesExpression(op: EffectOperation): boolean {
  return op !== "proficiency" && op !== "grant";
}

export const MAX_EFFECTS_PER_SOURCE = 20;
