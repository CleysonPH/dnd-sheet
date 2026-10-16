import { z } from "zod";

import {
  ACTIVE_CONDITIONS,
  CONDITIONS,
  DAMAGE_TYPES,
  MAX_EXHAUSTION,
  MAX_TAG_LENGTH,
  MAX_TAGS,
  tagKey,
} from "./keys";

/*
 * Proficiências, defesas e condições no documento da ficha (design T2).
 */

export const tagSchema = z
  .string()
  .trim()
  .min(1, "Informe um nome")
  .max(MAX_TAG_LENGTH, `Use no máximo ${MAX_TAG_LENGTH} caracteres`);

/** Lista de etiquetas livres, sem repetição (sem diferenciar maiúsculas). */
export const tagListSchema = z
  .array(tagSchema)
  .max(MAX_TAGS, `Use no máximo ${MAX_TAGS} itens`)
  .superRefine((tags, ctx) => {
    const seen = new Set<string>();
    tags.forEach((tag, index) => {
      const key = tagKey(tag);
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          message: "Item repetido",
          path: [index],
        });
      }
      seen.add(key);
    });
  });

/** Lista de valores de uma lista fechada, sem repetição. */
function uniqueList<const T extends readonly [string, ...string[]]>(values: T) {
  return z
    .array(z.enum(values))
    .refine((list) => new Set(list).size === list.length, "Item repetido");
}

export const proficienciesSchema = z.strictObject({
  armor: z.strictObject({
    light: z.boolean(),
    medium: z.boolean(),
    heavy: z.boolean(),
    shield: z.boolean(),
  }),
  weapons: z.strictObject({
    simple: z.boolean(),
    martial: z.boolean(),
    other: tagListSchema,
  }),
  tools: tagListSchema,
  languages: tagListSchema,
});

export const defensesSchema = z.strictObject({
  resistances: uniqueList(DAMAGE_TYPES),
  immunities: uniqueList(DAMAGE_TYPES),
  vulnerabilities: uniqueList(DAMAGE_TYPES),
  conditionImmunities: uniqueList(CONDITIONS),
});

export const conditionsSchema = uniqueList(ACTIVE_CONDITIONS);

const EXHAUSTION_MESSAGE = `A Exaustão vai de 0 a ${MAX_EXHAUSTION}`;
export const exhaustionSchema = z
  .number(EXHAUSTION_MESSAGE)
  .int(EXHAUSTION_MESSAGE)
  .min(0, EXHAUSTION_MESSAGE)
  .max(MAX_EXHAUSTION, EXHAUSTION_MESSAGE);

export type Proficiencies = z.infer<typeof proficienciesSchema>;
export type Defenses = z.infer<typeof defensesSchema>;

export function emptyProficiencies(): Proficiencies {
  return {
    armor: { light: false, medium: false, heavy: false, shield: false },
    weapons: { simple: false, martial: false, other: [] },
    tools: [],
    languages: [],
  };
}

export function emptyDefenses(): Defenses {
  return {
    resistances: [],
    immunities: [],
    vulnerabilities: [],
    conditionImmunities: [],
  };
}
