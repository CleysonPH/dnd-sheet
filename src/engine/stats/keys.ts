/*
 * Regras do 5.5e usadas pelo cálculo, em forma de dados (design S2). Os rótulos
 * em português ficam na UI (src/components/sheet/labels.ts).
 */

export const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"] as const;
export type Ability = (typeof ABILITIES)[number];

/** As 18 perícias do 5.5e e o atributo de cada uma. */
export const SKILL_ABILITY = {
  acrobatics: "dex",
  animalHandling: "wis",
  arcana: "int",
  athletics: "str",
  performance: "cha",
  deception: "cha",
  stealth: "dex",
  history: "int",
  intimidation: "cha",
  insight: "wis",
  investigation: "int",
  medicine: "wis",
  nature: "int",
  perception: "wis",
  persuasion: "cha",
  sleightOfHand: "dex",
  religion: "int",
  survival: "wis",
} as const satisfies Record<string, Ability>;

export type Skill = keyof typeof SKILL_ABILITY;
export const SKILLS = Object.keys(SKILL_ABILITY) as Skill[];

export const PROFICIENCY_LEVELS = ["none", "proficient", "expertise"] as const;
export type ProficiencyLevel = (typeof PROFICIENCY_LEVELS)[number];

/** Quantas vezes o bônus de proficiência entra em cada nível. */
export const PROFICIENCY_MULTIPLIER: Record<ProficiencyLevel, number> = {
  none: 0,
  proficient: 1,
  expertise: 2,
};

export const HIT_DICE = [6, 8, 10, 12] as const;
export type HitDie = (typeof HIT_DICE)[number];

/** Bônus de proficiência: +2 nos níveis 1-4, +1 a cada 4 níveis. */
export function proficiencyBonusForLevel(level: number): number {
  return 2 + Math.floor((level - 1) / 4);
}

/** Todos os valores derivados que aceitam override (design S2). */
export const DERIVED_KEYS = [
  ...ABILITIES.map((a) => `mod.${a}` as const),
  "proficiencyBonus",
  ...ABILITIES.map((a) => `save.${a}` as const),
  ...SKILLS.map((s) => `skill.${s}` as const),
  "initiative",
  "passivePerception",
  "hitPointsMax",
  "hitDiceMax",
] as const;

export type DerivedKey =
  | `mod.${Ability}`
  | "proficiencyBonus"
  | `save.${Ability}`
  | `skill.${Skill}`
  | "initiative"
  | "passivePerception"
  | "hitPointsMax"
  | "hitDiceMax";
