import type { Effect } from "@/engine/effects/schema";
import {
  GRANT_VALUES,
  isGrantTarget,
  type EffectOperation,
  type EffectProficiency,
  type EffectTarget,
  type GrantTarget,
} from "@/engine/effects/targets";
import {
  ABILITIES,
  SKILLS,
  type Ability,
  type Skill,
} from "@/engine/stats/keys";

import type {
  ArmorProficiency,
  Condition,
  DamageType,
  WeaponCategory,
} from "@/engine/traits/keys";

import {
  ABILITY_LABEL,
  ARMOR_PROFICIENCY_LABEL,
  CONDITION_LABEL,
  DAMAGE_TYPE_LABEL,
  SKILL_LABEL,
  WEAPON_CATEGORY_LABEL,
} from "../labels";
import {
  LANGUAGE_SUGGESTIONS,
  TOOL_SUGGESTIONS,
  WEAPON_SUGGESTIONS,
} from "../suggestions";

/** Rótulos dos efeitos (design E7). */

export const OPERATION_LABEL: Record<EffectOperation, string> = {
  add: "Somar",
  altBase: "Base alternativa",
  set: "Definir",
  proficiency: "Proficiência",
  grant: "Conceder",
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

const GRANT_TARGET_LABEL: Record<GrantTarget, string> = {
  "proficiency.armor": "proficiência com armadura",
  "proficiency.weapon": "proficiência com arma",
  "proficiency.tool": "proficiência com ferramenta",
  language: "idioma",
  "defense.resistance": "resistência a dano",
  "defense.immunity": "imunidade a dano",
  "defense.vulnerability": "vulnerabilidade a dano",
  "defense.conditionImmunity": "imunidade a condição",
};

/** Rótulo de um valor fechado de "conceder" ("Pesada", "fogo"...). */
export function grantClosedLabel(target: GrantTarget, value: string): string {
  switch (target) {
    case "proficiency.armor":
      return ARMOR_PROFICIENCY_LABEL[value as ArmorProficiency];
    case "proficiency.weapon":
      return WEAPON_CATEGORY_LABEL[value as WeaponCategory];
    case "defense.conditionImmunity":
      return CONDITION_LABEL[value as Condition].toLocaleLowerCase("pt-BR");
    default:
      return DAMAGE_TYPE_LABEL[value as DamageType];
  }
}

/** Valor de "conceder" para mostrar: o rótulo do fechado ou o texto livre. */
export function grantValueLabel(target: GrantTarget, value: string): string {
  return GRANT_VALUES[target].values.includes(value)
    ? grantClosedLabel(target, value)
    : value.trim();
}

/** Sugestões dos alvos livres de "conceder" (design T9). */
export const GRANT_SUGGESTIONS: Partial<Record<GrantTarget, string[]>> = {
  "proficiency.weapon": WEAPON_SUGGESTIONS,
  "proficiency.tool": TOOL_SUGGESTIONS,
  language: LANGUAGE_SUGGESTIONS,
};

/** Valor inicial válido ao escolher um alvo de "conceder". */
export function defaultGrantValue(target: GrantTarget): string {
  return GRANT_VALUES[target].values[0] ?? GRANT_SUGGESTIONS[target]?.[0] ?? "";
}

/** Nome do alvo, curto o bastante para o resumo ("FOR", "Furtividade"). */
export function targetLabel(target: EffectTarget): string {
  if (isGrantTarget(target)) return GRANT_TARGET_LABEL[target];
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
  {
    label: "Proficiências",
    targets: [
      "proficiency.armor",
      "proficiency.weapon",
      "proficiency.tool",
      "language",
    ],
  },
  {
    label: "Defesas",
    targets: [
      "defense.resistance",
      "defense.immunity",
      "defense.vulnerability",
      "defense.conditionImmunity",
    ],
  },
];

/** Resumo de "conceder": "Idioma: Élfico", "Resistência a fogo"... */
function describeGrant(target: GrantTarget, value: string): string {
  const label = grantValueLabel(target, value);
  switch (target) {
    case "proficiency.armor":
      return `Proficiência: armadura ${label.toLocaleLowerCase("pt-BR")}`;
    case "proficiency.weapon":
      return GRANT_VALUES[target].values.includes(value)
        ? `Proficiência: armas ${label.toLocaleLowerCase("pt-BR")}`
        : `Proficiência: ${label}`;
    case "proficiency.tool":
      return `Proficiência: ${label}`;
    case "language":
      return `Idioma: ${label}`;
    case "defense.resistance":
      return `Resistência a ${label}`;
    case "defense.immunity":
    case "defense.conditionImmunity":
      return `Imunidade a ${label}`;
    case "defense.vulnerability":
      return `Vulnerabilidade a ${label}`;
  }
}

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
    case "grant":
      text = isGrantTarget(effect.target)
        ? describeGrant(effect.target, effect.value)
        : target;
      break;
  }
  const conditions = [
    effect.noArmor && "sem armadura",
    effect.noShield && "sem escudo",
  ].filter(Boolean);
  return conditions.length > 0 ? `${text} (${conditions.join(", ")})` : text;
}
