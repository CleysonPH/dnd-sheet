import type {
  ARMOR_TYPES,
  FEAT_CATEGORIES,
  ITEM_CATEGORIES,
  SPELL_SCHOOLS,
  TRAIT_ORIGINS,
} from "@/engine/sources/kinds";
import type { Source, Spell } from "@/engine/sources/schema";

import { formatDecimal } from "../parse";

/** Rótulos em português das listas de src/engine/sources/kinds.ts. */

export const FEAT_CATEGORY_LABEL: Record<
  (typeof FEAT_CATEGORIES)[number],
  string
> = {
  origin: "origem",
  general: "geral",
  fightingStyle: "estilo de luta",
  epicBoon: "dádiva épica",
};

export const TRAIT_ORIGIN_LABEL: Record<
  (typeof TRAIT_ORIGINS)[number],
  string
> = {
  class: "Classe",
  subclass: "Subclasse",
  species: "Espécie",
  background: "Antecedente",
  other: "Outro",
};

export const ITEM_CATEGORY_LABEL: Record<
  (typeof ITEM_CATEGORIES)[number],
  string
> = {
  weapon: "Arma",
  armor: "Armadura",
  shield: "Escudo",
  gear: "Equipamento",
  consumable: "Consumível",
  other: "Outro",
};

export const ARMOR_TYPE_LABEL: Record<(typeof ARMOR_TYPES)[number], string> = {
  light: "leve",
  medium: "média",
  heavy: "pesada",
};

export const SPELL_SCHOOL_LABEL: Record<
  (typeof SPELL_SCHOOLS)[number],
  string
> = {
  abjuration: "Abjuração",
  divination: "Adivinhação",
  conjuration: "Conjuração",
  enchantment: "Encantamento",
  evocation: "Evocação",
  illusion: "Ilusão",
  necromancy: "Necromancia",
  transmutation: "Transmutação",
};

export function spellLevelLabel(level: number): string {
  return level === 0 ? "Truque" : `${level}º círculo`;
}

export function formatWeight(kg: number): string {
  return `${formatDecimal(kg)} kg`;
}

export function spellComponents(spell: Spell): string {
  const parts = [
    spell.verbal && "V",
    spell.somatic && "S",
    spell.material && (spell.materialText ? `M (${spell.materialText})` : "M"),
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}

/** Resumo de uma linha mostrado no cabeçalho do cartão. */
export function sourceSummary(source: Source): string {
  switch (source.kind) {
    case "feat":
      return `Talento ${FEAT_CATEGORY_LABEL[source.category]}`;
    case "trait":
      return ["Traço", TRAIT_ORIGIN_LABEL[source.origin], source.from]
        .filter(Boolean)
        .join(" · ");
    case "item": {
      const kind =
        source.category === "armor"
          ? `Armadura ${ARMOR_TYPE_LABEL[source.armorType]} · CA ${source.armorBase}`
          : source.category === "shield"
            ? `Escudo +${source.shieldBonus}`
            : ITEM_CATEGORY_LABEL[source.category];
      return [kind, formatWeight(source.weight)].join(" · ");
    }
    case "spell":
      return [
        SPELL_SCHOOL_LABEL[source.school],
        source.castingTime,
        source.range,
      ]
        .filter(Boolean)
        .join(" · ");
  }
}
