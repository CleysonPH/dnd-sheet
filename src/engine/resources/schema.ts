import { z } from "zod";

import type { ExpressionScope } from "@/engine/effects/expression";
import { expressionSchema } from "@/engine/effects/expression-schema";

/*
 * Recursos da ficha (design R1): trackers das fontes e espaços de magia.
 * Guardam o "usado"; o atual é calculado a partir do máximo.
 */

export const RECHARGE_MODES = ["none", "all", "amount"] as const;
export const MAX_TRACKERS_PER_SOURCE = 10;
export const SPELL_SLOT_LEVELS = 9;

function intRange(min: number, max: number) {
  const message = `O valor vai de ${min} a ${max}`;
  return z.number(message).int(message).min(min, message).max(max, message);
}

export const trackerNameSchema = z
  .string()
  .trim()
  .min(1, "O nome é obrigatório")
  .max(50, "Use no máximo 50 caracteres");

/** Máximo do tracker: expressão com a gramática dos efeitos. */
export const trackerMaxSchema = expressionSchema("sheet");

/**
 * Regra de um descanso: não recupera, recupera tudo ou recupera `amount`.
 * `amount` fica sempre presente e válido, para que trocar o modo não apague
 * nada (design R1).
 */
function rechargeSchemaFor(scope: ExpressionScope) {
  return z.strictObject({
    mode: z.enum(RECHARGE_MODES),
    amount: expressionSchema(scope),
  });
}

export const rechargeSchema = rechargeSchemaFor("sheet");

/** Tracker com as expressões validadas no escopo dado (design H2). */
export function trackerSchemaFor(scope: ExpressionScope) {
  const recharge = rechargeSchemaFor(scope);
  return z.strictObject({
    id: z.string().min(1).max(64),
    name: trackerNameSchema,
    max: expressionSchema(scope),
    used: intRange(0, 999),
    shortRest: recharge,
    longRest: recharge,
  });
}

export const trackerSchema = trackerSchemaFor("sheet");

export function trackersSchemaFor(scope: ExpressionScope) {
  return z
    .array(trackerSchemaFor(scope))
    .max(
      MAX_TRACKERS_PER_SOURCE,
      `Use no máximo ${MAX_TRACKERS_PER_SOURCE} trackers`,
    )
    .superRefine((trackers, ctx) => {
      const seen = new Set<string>();
      trackers.forEach((tracker, index) => {
        if (seen.has(tracker.id)) {
          ctx.addIssue({
            code: "custom",
            message: "Id de tracker repetido",
            path: [index, "id"],
          });
        }
        seen.add(tracker.id);
      });
    });
}

export const trackersSchema = trackersSchemaFor("sheet");

export const slotCountSchema = intRange(0, 20);

export const spellSlotSchema = z.strictObject({
  max: slotCountSchema,
  used: slotCountSchema,
});

/** Do 1º ao 9º círculo, nessa ordem. */
export const spellSlotsSchema = z
  .array(spellSlotSchema)
  .length(SPELL_SLOT_LEVELS, "A ficha tem espaços do 1º ao 9º círculo");

export const pactSlotsSchema = z.strictObject({
  level: intRange(1, 9),
  max: slotCountSchema,
  used: slotCountSchema,
});

export type Tracker = z.infer<typeof trackerSchema>;
export type Recharge = z.infer<typeof rechargeSchema>;
export type SpellSlot = z.infer<typeof spellSlotSchema>;
export type PactSlots = z.infer<typeof pactSlotsSchema>;

/** Tracker novo (design R4). */
export function createTracker(id: string): Tracker {
  return {
    id,
    name: "Usos",
    max: "1",
    used: 0,
    shortRest: { mode: "none", amount: "1" },
    longRest: { mode: "all", amount: "1" },
  };
}

export function emptySpellSlots(): SpellSlot[] {
  return Array.from({ length: SPELL_SLOT_LEVELS }, () => ({ max: 0, used: 0 }));
}
