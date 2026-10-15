/*
 * Listas fechadas das fontes da ficha (design F1). Os rótulos em português
 * ficam na UI.
 */

export const SOURCE_KINDS = ["feat", "trait", "item", "spell"] as const;
export type SourceKind = (typeof SOURCE_KINDS)[number];

export const FEAT_CATEGORIES = [
  "origin",
  "general",
  "fightingStyle",
  "epicBoon",
] as const;

export const TRAIT_ORIGINS = [
  "class",
  "subclass",
  "species",
  "background",
  "other",
] as const;

export const ITEM_CATEGORIES = [
  "weapon",
  "armor",
  "shield",
  "gear",
  "consumable",
  "other",
] as const;

export const SPELL_SCHOOLS = [
  "abjuration",
  "divination",
  "conjuration",
  "enchantment",
  "evocation",
  "illusion",
  "necromancy",
  "transmutation",
] as const;

/** Quantas fontes uma ficha pode ter. */
export const MAX_SOURCES = 300;

/** Itens sintonizados ao mesmo tempo antes do aviso (5.5e). */
export const ATTUNEMENT_LIMIT = 3;
