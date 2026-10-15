import { z } from "zod";

import { parseExpression } from "./expression";
import {
  EFFECT_OPERATIONS,
  EFFECT_PROFICIENCIES,
  EFFECT_TARGETS,
  MAX_EFFECTS_PER_SOURCE,
  operationsFor,
  usesExpression,
} from "./targets";

/*
 * Formato de um efeito (design E1): todos os campos sempre presentes; o que
 * não se aplica à operação é ignorado no cálculo.
 */

export const effectExpressionSchema = z
  .string()
  .max(100, "Use no máximo 100 caracteres");

export const effectSchema = z
  .strictObject({
    id: z.string().min(1).max(64),
    target: z.enum(EFFECT_TARGETS),
    op: z.enum(EFFECT_OPERATIONS),
    expression: effectExpressionSchema,
    proficiency: z.enum(EFFECT_PROFICIENCIES),
    noArmor: z.boolean(),
    noShield: z.boolean(),
  })
  .superRefine((effect, ctx) => {
    if (!operationsFor(effect.target).includes(effect.op)) {
      ctx.addIssue({
        code: "custom",
        message: "Operação incompatível com o alvo",
        path: ["op"],
      });
    }
    if (usesExpression(effect.op)) {
      const parsed = parseExpression(effect.expression);
      if (!parsed.ok) {
        ctx.addIssue({
          code: "custom",
          message: parsed.error,
          path: ["expression"],
        });
      }
    }
  });

export const effectsSchema = z
  .array(effectSchema)
  .max(
    MAX_EFFECTS_PER_SOURCE,
    `Use no máximo ${MAX_EFFECTS_PER_SOURCE} efeitos`,
  )
  .superRefine((effects, ctx) => {
    const seen = new Set<string>();
    effects.forEach((effect, index) => {
      if (seen.has(effect.id)) {
        ctx.addIssue({
          code: "custom",
          message: "Id de efeito repetido",
          path: [index, "id"],
        });
      }
      seen.add(effect.id);
    });
  });

export type Effect = z.infer<typeof effectSchema>;

/** Efeito novo: somar 1 na CA (design E7). */
export function createEffect(id: string): Effect {
  return {
    id,
    target: "armorClass",
    op: "add",
    expression: "1",
    proficiency: "proficient",
    noArmor: false,
    noShield: false,
  };
}
