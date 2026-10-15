import type { SourceKind } from "./kinds";
import type { Feat, Item, Source, Spell, Trait } from "./schema";

export { ATTUNEMENT_LIMIT } from "./kinds";

/*
 * Regras puras das fontes (design F3).
 */

/** Um item vale quando equipado e, se exigir, sintonizado. */
export function isItemActive(item: Item): boolean {
  return item.equipped && (!item.requiresAttunement || item.attuned);
}

function items(sources: readonly Source[]): Item[] {
  return sources.filter((source): source is Item => source.kind === "item");
}

function spells(sources: readonly Source[]): Spell[] {
  return sources.filter((source): source is Spell => source.kind === "spell");
}

export function attunedCount(sources: readonly Source[]): number {
  return items(sources).filter((item) => item.attuned).length;
}

/**
 * Peso unitário x quantidade de todos os itens, em kg. A soma é feita em
 * centésimos para não acumular erro de ponto flutuante.
 */
export function totalWeight(sources: readonly Source[]): number {
  const hundredths = items(sources).reduce(
    (sum, item) => sum + Math.round(item.weight * 100) * item.quantity,
    0,
  );
  return hundredths / 100;
}

export type SpellGroup = { level: number; spells: Spell[] };

/** Grupos do truque ao 9º, só os não vazios, cada um em ordem alfabética. */
export function spellsByLevel(sources: readonly Source[]): SpellGroup[] {
  const groups: SpellGroup[] = [];
  for (let level = 0; level <= 9; level++) {
    const ofLevel = spells(sources)
      .filter((spell) => spell.level === level)
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    if (ofLevel.length > 0) groups.push({ level, spells: ofLevel });
  }
  return groups;
}

function countPreparation(
  sources: readonly Source[],
  preparation: Spell["preparation"],
): number {
  return spells(sources).filter(
    (spell) => spell.level > 0 && spell.preparation === preparation,
  ).length;
}

/** Magias de 1º círculo ou acima preparadas: as que contam no limite (M4). */
export function preparedCount(sources: readonly Source[]): number {
  return countPreparation(sources, "prepared");
}

/** Magias de 1º círculo ou acima sempre preparadas (M4). */
export function alwaysPreparedCount(sources: readonly Source[]): number {
  return countPreparation(sources, "always");
}

type SourceOf<K extends SourceKind> = Extract<Source, { kind: K }>;

/** Fonte nova de cada tipo, com os valores iniciais. */
export function createSource<K extends SourceKind>(
  kind: K,
  name: string,
  id: string,
): SourceOf<K> {
  const base = {
    id,
    name: name.trim(),
    description: "",
    effects: [],
    trackers: [],
  };
  const byKind: { [T in SourceKind]: SourceOf<T> } = {
    feat: { ...base, kind: "feat", category: "general" } satisfies Feat,
    trait: {
      ...base,
      kind: "trait",
      origin: "class",
      from: "",
    } satisfies Trait,
    item: {
      ...base,
      kind: "item",
      category: "gear",
      quantity: 1,
      weight: 0,
      price: "",
      equipped: false,
      requiresAttunement: false,
      attuned: false,
      armorType: "light",
      armorBase: 10,
      shieldBonus: 2,
    } satisfies Item,
    spell: {
      ...base,
      kind: "spell",
      level: 0,
      school: "evocation",
      spellClass: "",
      castingTime: "",
      range: "",
      duration: "",
      verbal: false,
      somatic: false,
      material: false,
      materialText: "",
      concentration: false,
      ritual: false,
      preparation: "none",
      castingAbility: "sheet",
      active: false,
    } satisfies Spell,
  };
  return byKind[kind];
}
