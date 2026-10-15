import type { Effect } from "@/engine/effects/schema";
import type {
  EffectOperation,
  EffectProficiency,
  EffectTarget,
} from "@/engine/effects/targets";
import {
  ABILITIES,
  SKILLS,
  type Ability,
  type Skill,
} from "@/engine/stats/keys";

import { ABILITY_LABEL, SKILL_LABEL } from "../labels";

/** Rótulos dos efeitos (design E7). */

export const OPERATION_LABEL: Record<EffectOperation, string> = {
  add: "Somar",
  altBase: "Base alternativa",
  set: "Definir",
  proficiency: "Proficiência",
};

export const EFFECT_PROFICIENCY_LABEL: Record<EffectProficiency, string> = {
  half: "Metade da proficiência",
  proficient: "Proficiência",
  expertise: "Expertise",
};

const COMBAT_LABEL = {
  armorClass: "CA",
  initiative: "Iniciativa",
  speed: "Deslocamento",
  hitPointsMax: "PV máximo",
  passivePerception: "Percepção passiva",
  spellSaveDc: "CD de magia",
  spellAttack: "Ataque mágico",
} as const;

/** Nome do alvo, curto o bastante para o resumo ("FOR", "Furtividade"). */
export function targetLabel(target: EffectTarget): string {
  if (target === "save.all") return "todas as salvaguardas";
  if (target === "skill.all") return "todas as perícias";
  const [kind, name] = target.split(".") as [string, string | undefined];
  switch (kind) {
    case "ability":
      return ABILITY_LABEL[name as Ability].short;
    case "save":
      return `salvaguarda de ${ABILITY_LABEL[name as Ability].short}`;
    case "skill":
      return SKILL_LABEL[name as Skill];
    default:
      return COMBAT_LABEL[target as keyof typeof COMBAT_LABEL];
  }
}

/** Grupos do <select> de alvo. */
export const TARGET_GROUPS: { label: string; targets: EffectTarget[] }[] = [
  {
    label: "Atributos",
    targets: ABILITIES.map((ability) => `ability.${ability}` as const),
  },
  {
    label: "Salvaguardas",
    targets: [
      "save.all",
      ...ABILITIES.map((ability) => `save.${ability}` as const),
    ],
  },
  {
    label: "Perícias",
    targets: ["skill.all", ...SKILLS.map((skill) => `skill.${skill}` as const)],
  },
  {
    label: "Combate",
    targets: [
      "armorClass",
      "initiative",
      "speed",
      "hitPointsMax",
      "passivePerception",
    ],
  },
  { label: "Magia", targets: ["spellSaveDc", "spellAttack"] },
];

/** Opção do <select> de alvo: o nome completo, com inicial maiúscula. */
export function targetOptionLabel(target: EffectTarget): string {
  if (target.startsWith("ability.")) {
    return ABILITY_LABEL[target.slice("ability.".length) as Ability].name;
  }
  const label = targetLabel(target);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Resumo de um efeito: "+1 CA", "CA base 10 + des.mod", "FOR = 19"... */
export function describeEffect(effect: Effect): string {
  const target = targetLabel(effect.target);
  const expression = effect.expression.trim();
  let text: string;
  switch (effect.op) {
    case "add":
      text = /^-?\d+$/.test(expression)
        ? `${Number(expression) >= 0 ? "+" : ""}${Number(expression)} ${target}`
        : `${target} + (${expression})`;
      break;
    case "altBase":
      text = `${target} base ${expression}`;
      break;
    case "set":
      text = `${target} = ${expression}`;
      break;
    case "proficiency":
      text = `${EFFECT_PROFICIENCY_LABEL[effect.proficiency]} em ${target}`;
      break;
  }
  const conditions = [
    effect.noArmor && "sem armadura",
    effect.noShield && "sem escudo",
  ].filter(Boolean);
  return conditions.length > 0 ? `${text} (${conditions.join(", ")})` : text;
}
