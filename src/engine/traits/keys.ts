/*
 * Listas fechadas de proficiências, defesas e condições do 5.5e (design T2).
 * Os rótulos em português ficam na UI (src/components/sheet/labels.ts).
 */

export const ARMOR_PROFICIENCIES = [
  "light",
  "medium",
  "heavy",
  "shield",
] as const;
export type ArmorProficiency = (typeof ARMOR_PROFICIENCIES)[number];

export const WEAPON_CATEGORIES = ["simple", "martial"] as const;
export type WeaponCategory = (typeof WEAPON_CATEGORIES)[number];

/** Os 13 tipos de dano. */
export const DAMAGE_TYPES = [
  "acid",
  "bludgeoning",
  "slashing",
  "lightning",
  "force",
  "fire",
  "cold",
  "necrotic",
  "piercing",
  "psychic",
  "radiant",
  "thunder",
  "poison",
] as const;
export type DamageType = (typeof DAMAGE_TYPES)[number];

/** As 15 condições, na ordem alfabética dos nomes em português. */
export const CONDITIONS = [
  "grappled",
  "frightened",
  "stunned",
  "prone",
  "blinded",
  "charmed",
  "poisoned",
  "exhaustion",
  "restrained",
  "incapacitated",
  "unconscious",
  "invisible",
  "paralyzed",
  "petrified",
  "deafened",
] as const;
export type Condition = (typeof CONDITIONS)[number];

/** Condições marcáveis na faixa; a Exaustão tem nível próprio (design T6). */
export const ACTIVE_CONDITIONS = [
  "grappled",
  "frightened",
  "stunned",
  "prone",
  "blinded",
  "charmed",
  "poisoned",
  "restrained",
  "incapacitated",
  "unconscious",
  "invisible",
  "paralyzed",
  "petrified",
  "deafened",
] as const satisfies readonly Condition[];
export type ActiveCondition = (typeof ACTIVE_CONDITIONS)[number];

/** Etiquetas por lista livre (armas específicas, ferramentas, idiomas). */
export const MAX_TAGS = 30;
export const MAX_TAG_LENGTH = 50;

export const MAX_EXHAUSTION = 6;

/** Chave de comparação das etiquetas: sem espaços nas pontas e minúscula. */
export function tagKey(tag: string): string {
  return tag.trim().toLocaleLowerCase("pt-BR");
}
