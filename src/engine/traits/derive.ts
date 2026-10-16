import { collectActiveEffects } from "@/engine/effects/collect";
import { GRANT_VALUES, type GrantTarget } from "@/engine/effects/targets";
import type { SheetDocument } from "@/engine/sheet/document";
import type { Item } from "@/engine/sources/schema";

import {
  ARMOR_PROFICIENCIES,
  CONDITIONS,
  DAMAGE_TYPES,
  WEAPON_CATEGORIES,
  tagKey,
  type ArmorProficiency,
} from "./keys";

/*
 * Listas de proficiências e defesas exibidas: o que o jogador marcou na ficha
 * mais o que as fontes ativas concedem, com a origem de cada item (design T3).
 */

export type TraitSource = { id: string; name: string };

export type TraitEntry = {
  /** Valor da lista fechada, ou `tag:` + texto em minúsculas. */
  key: string;
  /** Valor da lista fechada (a UI traduz) ou o texto da primeira ocorrência. */
  label: string;
  /** Item da lista fechada (true) ou texto livre (false). */
  closed: boolean;
  fromSheet: boolean;
  sources: TraitSource[];
};

export type Traits = {
  armor: TraitEntry[];
  weapons: TraitEntry[];
  tools: TraitEntry[];
  languages: TraitEntry[];
  resistances: TraitEntry[];
  immunities: TraitEntry[];
  vulnerabilities: TraitEntry[];
  conditionImmunities: TraitEntry[];
};

/** Monta uma lista na ordem: fechados na ordem da lista, depois os livres. */
class TraitList {
  private entries = new Map<string, TraitEntry>();

  constructor(private readonly closedValues: readonly string[]) {}

  private entry(value: string): TraitEntry {
    const closed = this.closedValues.includes(value);
    const key = closed ? value : `tag:${tagKey(value)}`;
    let entry = this.entries.get(key);
    if (!entry) {
      entry = {
        key,
        label: closed ? value : value.trim(),
        closed,
        fromSheet: false,
        sources: [],
      };
      this.entries.set(key, entry);
    }
    return entry;
  }

  addFromSheet(value: string) {
    this.entry(value).fromSheet = true;
  }

  addFromSource(value: string, source: TraitSource) {
    const entry = this.entry(value);
    if (!entry.sources.some((known) => known.id === source.id)) {
      entry.sources.push(source);
    }
  }

  list(): TraitEntry[] {
    const all = [...this.entries.values()];
    const closed = this.closedValues.flatMap((value) =>
      all.filter((entry) => entry.closed && entry.key === value),
    );
    return [...closed, ...all.filter((entry) => !entry.closed)];
  }
}

const TARGET_LIST: Record<GrantTarget, keyof Traits> = {
  "proficiency.armor": "armor",
  "proficiency.weapon": "weapons",
  "proficiency.tool": "tools",
  language: "languages",
  "defense.resistance": "resistances",
  "defense.immunity": "immunities",
  "defense.vulnerability": "vulnerabilities",
  "defense.conditionImmunity": "conditionImmunities",
};

export function deriveTraits(document: SheetDocument): Traits {
  const { proficiencies, defenses } = document;
  const lists: Record<keyof Traits, TraitList> = {
    armor: new TraitList(ARMOR_PROFICIENCIES),
    weapons: new TraitList(WEAPON_CATEGORIES),
    tools: new TraitList([]),
    languages: new TraitList([]),
    resistances: new TraitList(DAMAGE_TYPES),
    immunities: new TraitList(DAMAGE_TYPES),
    vulnerabilities: new TraitList(DAMAGE_TYPES),
    conditionImmunities: new TraitList(CONDITIONS),
  };

  for (const armor of ARMOR_PROFICIENCIES) {
    if (proficiencies.armor[armor]) lists.armor.addFromSheet(armor);
  }
  for (const category of WEAPON_CATEGORIES) {
    if (proficiencies.weapons[category]) lists.weapons.addFromSheet(category);
  }
  proficiencies.weapons.other.forEach((tag) => lists.weapons.addFromSheet(tag));
  proficiencies.tools.forEach((tag) => lists.tools.addFromSheet(tag));
  proficiencies.languages.forEach((tag) => lists.languages.addFromSheet(tag));
  defenses.resistances.forEach((type) => lists.resistances.addFromSheet(type));
  defenses.immunities.forEach((type) => lists.immunities.addFromSheet(type));
  defenses.vulnerabilities.forEach((type) =>
    lists.vulnerabilities.addFromSheet(type),
  );
  defenses.conditionImmunities.forEach((condition) =>
    lists.conditionImmunities.addFromSheet(condition),
  );

  for (const { effect, source } of collectActiveEffects(document.sources)
    .effects) {
    if (effect.op !== "grant") continue;
    const target = effect.target as GrantTarget;
    const { values, free } = GRANT_VALUES[target];
    // O schema já valida; aqui só se ignora o que não serviria.
    if (!values.includes(effect.value) && (!free || !effect.value.trim())) {
      continue;
    }
    lists[TARGET_LIST[target]].addFromSource(effect.value, {
      id: source.id,
      name: source.name,
    });
  }

  return {
    armor: lists.armor.list(),
    weapons: lists.weapons.list(),
    tools: lists.tools.list(),
    languages: lists.languages.list(),
    resistances: lists.resistances.list(),
    immunities: lists.immunities.list(),
    vulnerabilities: lists.vulnerabilities.list(),
    conditionImmunities: lists.conditionImmunities.list(),
  };
}

export type UntrainedArmor = { item: Item; training: ArmorProficiency };

/**
 * Armaduras e escudos ativos sem a proficiência correspondente (design T5).
 * Só gera aviso: nenhum valor calculado muda.
 */
export function untrainedArmor(
  document: SheetDocument,
  traits: Traits,
): UntrainedArmor[] {
  const trained = new Set(traits.armor.map((entry) => entry.key));
  const { armors, shields } = collectActiveEffects(document.sources);
  return [
    ...armors.map((item) => ({ item, training: item.armorType })),
    ...shields.map((item) => ({ item, training: "shield" as const })),
  ].filter(({ training }) => !trained.has(training));
}
