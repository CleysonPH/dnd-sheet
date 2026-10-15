import {
  ABILITIES,
  SKILLS,
  type Ability,
  type Skill,
} from "@/engine/stats/keys";

/*
 * Alvos e operações dos efeitos (design E2). A lista é fechada: o jogador
 * escolhe numa lista, não digita.
 */

export const EFFECT_OPERATIONS = [
  "add",
  "altBase",
  "set",
  "proficiency",
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
  | "spellAttack";

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
] as const satisfies readonly EffectTarget[];

/** Operações aceitas por alvo. */
export function operationsFor(
  target: EffectTarget,
): readonly EffectOperation[] {
  if (target.startsWith("ability.")) return ["add", "set"];
  if (target.startsWith("save.") || target.startsWith("skill.")) {
    return ["add", "proficiency"];
  }
  if (target === "armorClass") return ["add", "altBase"];
  if (target === "speed") return ["add", "set"];
  return ["add"];
}

/** Operações que usam a expressão (proficiência usa o nível escolhido). */
export function usesExpression(op: EffectOperation): boolean {
  return op !== "proficiency";
}

export const MAX_EFFECTS_PER_SOURCE = 20;
