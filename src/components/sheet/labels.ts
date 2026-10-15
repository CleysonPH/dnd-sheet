import type {
  Ability,
  DerivedKey,
  ProficiencyLevel,
  Skill,
} from "@/engine/stats/keys";

/** Rótulos em português das chaves do engine (design S2). */

export const ABILITY_LABEL: Record<Ability, { name: string; short: string }> = {
  str: { name: "Força", short: "FOR" },
  dex: { name: "Destreza", short: "DES" },
  con: { name: "Constituição", short: "CON" },
  int: { name: "Inteligência", short: "INT" },
  wis: { name: "Sabedoria", short: "SAB" },
  cha: { name: "Carisma", short: "CAR" },
};

export const SKILL_LABEL: Record<Skill, string> = {
  acrobatics: "Acrobacia",
  animalHandling: "Adestrar Animais",
  arcana: "Arcanismo",
  athletics: "Atletismo",
  performance: "Atuação",
  deception: "Enganação",
  stealth: "Furtividade",
  history: "História",
  intimidation: "Intimidação",
  insight: "Intuição",
  investigation: "Investigação",
  medicine: "Medicina",
  nature: "Natureza",
  perception: "Percepção",
  persuasion: "Persuasão",
  sleightOfHand: "Prestidigitação",
  religion: "Religião",
  survival: "Sobrevivência",
};

export const PROFICIENCY_LABEL: Record<ProficiencyLevel, string> = {
  none: "sem proficiência",
  proficient: "proficiente",
  expertise: "expertise",
};

type OtherKey = Exclude<
  DerivedKey,
  `mod.${string}` | `save.${string}` | `skill.${string}`
>;

const OTHER_LABEL: Record<OtherKey, string> = {
  proficiencyBonus: "Bônus de proficiência",
  initiative: "Iniciativa",
  passivePerception: "Percepção passiva",
  hitPointsMax: "PV máximo",
  hitDiceMax: "Total de dados de vida",
  armorClass: "CA",
  speed: "Deslocamento",
  spellSaveDc: "CD de magia",
  spellAttack: "Ataque mágico",
};

/** Nome de um valor derivado, para títulos e leitores de tela. */
export function derivedLabel(key: DerivedKey): string {
  const [kind, name] = key.split(".") as [string, string | undefined];
  switch (kind) {
    case "mod":
      return `Modificador de ${ABILITY_LABEL[name as Ability].name}`;
    case "save":
      return `Salvaguarda de ${ABILITY_LABEL[name as Ability].name}`;
    case "skill":
      return SKILL_LABEL[name as Skill];
    default:
      return OTHER_LABEL[key as OtherKey];
  }
}
