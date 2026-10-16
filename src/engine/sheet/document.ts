import { z } from "zod";

import {
  ABILITIES,
  DERIVED_KEYS,
  HIT_DICE,
  PROFICIENCY_LEVELS,
  SKILLS,
  SPELLCASTING_ABILITIES,
  type Ability,
  type Skill,
} from "@/engine/stats/keys";
import {
  emptySpellSlots,
  pactSlotsSchema,
  spellSlotsSchema,
} from "@/engine/resources/schema";
import { sourcesSchema } from "@/engine/sources/schema";
import {
  conditionsSchema,
  defensesSchema,
  emptyDefenses,
  emptyProficiencies,
  exhaustionSchema,
  proficienciesSchema,
} from "@/engine/traits/schema";

/**
 * Versão atual do formato da ficha (design C2/C3).
 *
 * Toda mudança no schema abaixo precisa incrementar esta constante e
 * acrescentar em migrate.ts uma migração da versão anterior, com teste.
 */
export const SHEET_SCHEMA_VERSION = 9;

/** Tamanho máximo do documento serializado, em bytes. */
export const SHEET_MAX_BYTES = 256 * 1024;

const shortText = z.string().trim().max(100, "Use no máximo 100 caracteres");

export const identitySchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, "O nome é obrigatório")
    .max(100, "Use no máximo 100 caracteres"),
  species: shortText,
  class: shortText,
  level: z
    .number("O nível vai de 1 a 20")
    .int("O nível vai de 1 a 20")
    .min(1, "O nível vai de 1 a 20")
    .max(20, "O nível vai de 1 a 20"),
  background: shortText,
});

function fill<K extends string, T>(keys: readonly K[], value: T): Record<K, T> {
  return Object.fromEntries(keys.map((key) => [key, value])) as Record<K, T>;
}

function intRange(min: number, max: number) {
  const message = `O valor vai de ${min} a ${max}`;
  return z.number(message).int(message).min(min, message).max(max, message);
}

function byKey<K extends string, T extends z.ZodType>(
  keys: readonly K[],
  value: T,
) {
  return z.strictObject(fill(keys, value));
}

export const abilityScoreSchema = intRange(1, 30);

/** Metros, de 0 a 999, com no máximo uma casa decimal (design S1). */
const SPEED_MESSAGE = "Use um número de 0 a 999, com até uma casa decimal";
export const speedSchema = z
  .number(SPEED_MESSAGE)
  .min(0, SPEED_MESSAGE)
  .max(999, SPEED_MESSAGE)
  .refine(
    (value) => Math.abs(Math.round(value * 10) - value * 10) < 1e-9,
    SPEED_MESSAGE,
  );

export const overrideValueSchema = z
  .number("O valor deve ser inteiro")
  .int("O valor deve ser inteiro")
  .min(-999, "Use um inteiro de -999 a 999")
  .max(999, "Use um inteiro de -999 a 999");

export const hitPointsSchema = z.strictObject({
  hitDie: z.literal(HIT_DICE),
  /** Dano sofrido; o PV atual é calculado a partir do máximo (design S3). */
  damage: intRange(0, 999),
  temp: intRange(0, 999),
  hitDiceSpent: intRange(0, 999),
});

export const deathSavesSchema = z.strictObject({
  successes: intRange(0, 3),
  failures: intRange(0, 3),
});

export const sheetDocumentSchema = z.strictObject({
  schemaVersion: z.literal(SHEET_SCHEMA_VERSION),
  identity: identitySchema,
  abilities: byKey(ABILITIES, abilityScoreSchema),
  savingThrows: byKey(ABILITIES, z.boolean()),
  skills: byKey(SKILLS, z.enum(PROFICIENCY_LEVELS)),
  hitPoints: hitPointsSchema,
  deathSaves: deathSavesSchema,
  /** Inspiração heroica: o jogador liga e desliga (design I1). */
  heroicInspiration: z.boolean(),
  /** Atributo de conjuração da ficha (design K1). */
  spellcastingAbility: z.enum(SPELLCASTING_ABILITIES),
  speed: speedSchema,
  overrides: z.partialRecord(z.enum(DERIVED_KEYS), overrideValueSchema),
  sources: sourcesSchema,
  spellSlots: spellSlotsSchema,
  pactSlots: pactSlotsSchema,
  /** Proficiências marcadas pelo jogador; as fontes somam as suas (T3). */
  proficiencies: proficienciesSchema,
  defenses: defensesSchema,
  /** Condições ativas e nível de Exaustão (design T4, T6). */
  conditions: conditionsSchema,
  exhaustion: exhaustionSchema,
});

export type SheetIdentity = z.infer<typeof identitySchema>;
export type SheetDocument = z.infer<typeof sheetDocumentSchema>;

/**
 * Ficha nova: nível 1, demais campos de identificação vazios e os valores
 * iniciais das specs sheet-core-stats, sheet-sources e sheet-resources.
 */
export function createSheetDocument(name: string): SheetDocument {
  return sheetDocumentSchema.parse({
    schemaVersion: SHEET_SCHEMA_VERSION,
    identity: { name, species: "", class: "", level: 1, background: "" },
    abilities: fill<Ability, number>(ABILITIES, 10),
    savingThrows: fill<Ability, boolean>(ABILITIES, false),
    skills: fill<Skill, "none">(SKILLS, "none"),
    hitPoints: { hitDie: 8, damage: 0, temp: 0, hitDiceSpent: 0 },
    deathSaves: { successes: 0, failures: 0 },
    heroicInspiration: false,
    spellcastingAbility: "none",
    speed: 9,
    overrides: {},
    sources: [],
    spellSlots: emptySpellSlots(),
    pactSlots: { level: 1, max: 0, used: 0 },
    proficiencies: emptyProficiencies(),
    defenses: emptyDefenses(),
    conditions: [],
    exhaustion: 0,
  });
}

/** Tamanho do documento serializado em JSON, em bytes UTF-8. */
export function sheetDocumentBytes(document: unknown): number {
  return new TextEncoder().encode(JSON.stringify(document)).length;
}
