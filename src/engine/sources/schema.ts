import { z } from "zod";

import { effectsSchema } from "@/engine/effects/schema";

import {
  ARMOR_TYPES,
  FEAT_CATEGORIES,
  ITEM_CATEGORIES,
  MAX_SOURCES,
  SPELL_SCHOOLS,
  TRAIT_ORIGINS,
} from "./kinds";

/*
 * Formato das fontes no documento da ficha (design F1). As regras de
 * coerência entre campos ficam na lista, para valerem no cliente e no
 * servidor.
 */

function text(max: number) {
  return z.string().max(max, `Use no máximo ${max} caracteres`);
}

function intRange(min: number, max: number) {
  const message = `O valor vai de ${min} a ${max}`;
  return z.number(message).int(message).min(min, message).max(max, message);
}

export const sourceNameSchema = z
  .string()
  .trim()
  .min(1, "O nome é obrigatório")
  .max(100, "Use no máximo 100 caracteres");

export const sourceDescriptionSchema = text(5000);
export const sourceShortTextSchema = text(100);
export const itemPriceSchema = text(50);
export const itemQuantitySchema = intRange(0, 9999);
export const spellLevelSchema = intRange(0, 9);
export const armorBaseSchema = intRange(0, 30);
export const shieldBonusSchema = intRange(0, 10);

const WEIGHT_MESSAGE = "Use um número de 0 a 9999, com até duas casas decimais";
/** Peso de uma unidade, em kg. */
export const itemWeightSchema = z
  .number(WEIGHT_MESSAGE)
  .min(0, WEIGHT_MESSAGE)
  .max(9999, WEIGHT_MESSAGE)
  .refine(
    (value) => Math.abs(Math.round(value * 100) - value * 100) < 1e-6,
    WEIGHT_MESSAGE,
  );

const base = {
  id: z.string().min(1).max(64),
  name: sourceNameSchema,
  description: sourceDescriptionSchema,
  effects: effectsSchema,
};

export const featSchema = z.strictObject({
  ...base,
  kind: z.literal("feat"),
  category: z.enum(FEAT_CATEGORIES),
});

export const traitSchema = z.strictObject({
  ...base,
  kind: z.literal("trait"),
  origin: z.enum(TRAIT_ORIGINS),
  from: sourceShortTextSchema,
});

export const itemSchema = z.strictObject({
  ...base,
  kind: z.literal("item"),
  category: z.enum(ITEM_CATEGORIES),
  quantity: itemQuantitySchema,
  weight: itemWeightSchema,
  price: itemPriceSchema,
  equipped: z.boolean(),
  requiresAttunement: z.boolean(),
  attuned: z.boolean(),
  /** Usados quando a categoria é armadura ou escudo (design E1). */
  armorType: z.enum(ARMOR_TYPES),
  armorBase: armorBaseSchema,
  shieldBonus: shieldBonusSchema,
});

export const spellSchema = z.strictObject({
  ...base,
  kind: z.literal("spell"),
  level: spellLevelSchema,
  school: z.enum(SPELL_SCHOOLS),
  spellClass: sourceShortTextSchema,
  castingTime: sourceShortTextSchema,
  range: sourceShortTextSchema,
  duration: sourceShortTextSchema,
  verbal: z.boolean(),
  somatic: z.boolean(),
  material: z.boolean(),
  materialText: sourceShortTextSchema,
  concentration: z.boolean(),
  ritual: z.boolean(),
  prepared: z.boolean(),
  /** "Em efeito": os efeitos da magia só valem enquanto marcada. */
  active: z.boolean(),
});

export const sourceSchema = z.discriminatedUnion("kind", [
  featSchema,
  traitSchema,
  itemSchema,
  spellSchema,
]);

export const sourcesSchema = z
  .array(sourceSchema)
  .max(MAX_SOURCES, `Use no máximo ${MAX_SOURCES} fontes`)
  .superRefine((sources, ctx) => {
    const seen = new Set<string>();
    sources.forEach((source, index) => {
      if (seen.has(source.id)) {
        ctx.addIssue({
          code: "custom",
          message: "Id de fonte repetido",
          path: [index, "id"],
        });
      }
      seen.add(source.id);
      if (
        source.kind === "item" &&
        source.attuned &&
        !source.requiresAttunement
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Só itens que requerem sintonização podem ser sintonizados",
          path: [index, "attuned"],
        });
      }
      if (source.kind === "spell" && source.level === 0 && source.prepared) {
        ctx.addIssue({
          code: "custom",
          message: "Truques não são preparados",
          path: [index, "prepared"],
        });
      }
    });
  });

export type Source = z.infer<typeof sourceSchema>;
export type Feat = z.infer<typeof featSchema>;
export type Trait = z.infer<typeof traitSchema>;
export type Item = z.infer<typeof itemSchema>;
export type Spell = z.infer<typeof spellSchema>;
