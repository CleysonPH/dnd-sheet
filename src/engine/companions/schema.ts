import { z } from "zod";

import { actionsSchemaFor } from "@/engine/attacks/schema";
import { expressionSchema } from "@/engine/effects/expression-schema";
import { trackersSchemaFor } from "@/engine/resources/schema";
import {
  ABILITIES,
  PROFICIENCY_LEVELS,
  SKILLS,
  type Ability,
  type Skill,
} from "@/engine/stats/keys";
import { conditionsSchema } from "@/engine/traits/schema";

/*
 * Companheiros da ficha (design H1): o bloco de criatura, as ligações com o
 * dono e o estado de mesa. Todos os campos ficam sempre presentes (E1).
 */

export const MAX_COMPANIONS = 4;
export const COMPANION_HIT_DICE = [4, 6, 8, 10, 12, 20] as const;
export type CompanionHitDie = (typeof COMPANION_HIT_DICE)[number];
export const PB_MODES = ["owner", "own"] as const;
export const MAX_COMPANION_TRAITS = 2000;

function intRange(min: number, max: number) {
  const message = `O valor vai de ${min} a ${max}`;
  return z.number(message).int(message).min(min, message).max(max, message);
}

function text(max: number) {
  return z.string().trim().max(max, `Use no máximo ${max} caracteres`);
}

function fill<K extends string, T>(keys: readonly K[], value: T): Record<K, T> {
  return Object.fromEntries(keys.map((key) => [key, value])) as Record<K, T>;
}

function byKey<K extends string, T extends z.ZodType>(
  keys: readonly K[],
  value: T,
) {
  return z.strictObject(fill(keys, value));
}

const companionExpression = expressionSchema("companion");

export const summonSchema = z.strictObject({
  enabled: z.boolean(),
  minLevel: intRange(1, 9),
  /** Círculo atual; abaixo do mínimo, o cálculo usa o mínimo (H1). */
  level: intRange(1, 9),
});

export const companionSchema = z.strictObject({
  id: z.string().min(1).max(64),
  name: text(50).min(1, "O nome é obrigatório"),
  descriptor: text(100),
  abilities: byKey(ABILITIES, intRange(1, 30)),
  savingThrows: byKey(ABILITIES, z.boolean()),
  skills: byKey(SKILLS, z.enum(PROFICIENCY_LEVELS)),
  /** "Teste em tudo": PB em toda salvaguarda e perícia (Pack Bond). */
  allChecks: z.boolean(),
  pbMode: z.enum(PB_MODES),
  pb: intRange(0, 10),
  armorClass: companionExpression,
  hitPointsMax: companionExpression,
  hitDiceCount: companionExpression,
  hitDie: z.literal(COMPANION_HIT_DICE),
  speed: text(100),
  senses: text(100),
  languages: text(100),
  traits: text(MAX_COMPANION_TRAITS),
  summon: summonSchema,
  actions: actionsSchemaFor("companion"),
  trackers: trackersSchemaFor("companion"),
  damage: intRange(0, 999),
  temp: intRange(0, 999),
  hitDiceSpent: intRange(0, 999),
  conditions: conditionsSchema,
});

export const companionsSchema = z
  .array(companionSchema)
  .max(MAX_COMPANIONS, `Use no máximo ${MAX_COMPANIONS} companheiros`)
  .superRefine((companions, ctx) => {
    const seen = new Set<string>();
    companions.forEach((companion, index) => {
      if (seen.has(companion.id)) {
        ctx.addIssue({
          code: "custom",
          message: "Id de companheiro repetido",
          path: [index, "id"],
        });
      }
      seen.add(companion.id);
    });
  });

export type Companion = z.infer<typeof companionSchema>;

/**
 * Companheiro novo (spec sheet-companions): atributos 10, CA 10, PV máximo 1
 * e 1d8, PB do dono, sem invocação, ações nem usos.
 */
export function createCompanion(id: string): Companion {
  return {
    id,
    name: "Companheiro",
    descriptor: "",
    abilities: fill<Ability, number>(ABILITIES, 10),
    savingThrows: fill<Ability, boolean>(ABILITIES, false),
    skills: fill<Skill, "none">(SKILLS, "none"),
    allChecks: false,
    pbMode: "owner",
    pb: 2,
    armorClass: "10",
    hitPointsMax: "1",
    hitDiceCount: "1",
    hitDie: 8,
    speed: "",
    senses: "",
    languages: "",
    traits: "",
    summon: { enabled: false, minLevel: 1, level: 1 },
    actions: [],
    trackers: [],
    damage: 0,
    temp: 0,
    hitDiceSpent: 0,
    conditions: [],
  };
}
