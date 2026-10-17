import { z } from "zod";

import { parseExpression } from "@/engine/effects/expression";
import { ABILITIES } from "@/engine/stats/keys";
import { DAMAGE_TYPES } from "@/engine/traits/keys";

/*
 * Ações das fontes (design G1): ataques, salvaguardas e curas. Todos os campos
 * ficam sempre presentes; o que não se aplica ao modo de resolução é ignorado
 * no cálculo, para que trocar de modo não apague nem invalide nada.
 */

export const ACTION_RESOLUTIONS = ["attack", "save", "auto"] as const;
export type ActionResolution = (typeof ACTION_RESOLUTIONS)[number];

export const ACTION_RANGES = ["melee", "ranged"] as const;
export type ActionRange = (typeof ACTION_RANGES)[number];

/** Atributo do acerto ou de uma parte: acuidade é o maior de FOR e DES. */
export const ACTION_ABILITIES = [
  ...ABILITIES,
  "none",
  "finesse",
  "spellcasting",
] as const;
export type ActionAbility = (typeof ACTION_ABILITIES)[number];

/** Atributo de uma parte: também "o mesmo do acerto". */
export const PART_ABILITIES = [...ACTION_ABILITIES, "attack"] as const;
export type PartAbility = (typeof PART_ABILITIES)[number];

export const ACTION_PROFICIENCIES = ["auto", "always", "never"] as const;
export type ActionProficiency = (typeof ACTION_PROFICIENCIES)[number];

export const DC_MODES = ["spell", "expression"] as const;
export const SAVE_OUTCOMES = ["none", "half"] as const;

export const DICE = ["d4", "d6", "d8", "d10", "d12", "d20"] as const;
export type Die = (typeof DICE)[number];

export const PART_TYPES = [...DAMAGE_TYPES, "healing", "tempHp"] as const;
export type PartType = (typeof PART_TYPES)[number];

export const MAX_ACTIONS_PER_SOURCE = 6;
export const MAX_PARTS_PER_ACTION = 4;

function intRange(min: number, max: number) {
  const message = `O valor vai de ${min} a ${max}`;
  return z.number(message).int(message).min(min, message).max(max, message);
}

/** Expressão com a gramática dos efeitos, sempre validada. */
export const actionExpressionSchema = z
  .string()
  .max(100, "Use no máximo 100 caracteres")
  .superRefine((text, ctx) => {
    const parsed = parseExpression(text);
    if (!parsed.ok) ctx.addIssue({ code: "custom", message: parsed.error });
  });

export const actionNameSchema = z
  .string()
  .trim()
  .max(50, "Use no máximo 50 caracteres");

function uniqueIds(
  label: string,
): (list: { id: string }[], ctx: z.RefinementCtx) => void {
  return (list, ctx) => {
    const seen = new Set<string>();
    list.forEach((entry, index) => {
      if (seen.has(entry.id)) {
        ctx.addIssue({
          code: "custom",
          message: `Id de ${label} repetido`,
          path: [index, "id"],
        });
      }
      seen.add(entry.id);
    });
  };
}

export const partSchema = z.strictObject({
  id: z.string().min(1).max(64),
  count: intRange(0, 40),
  die: z.enum(DICE),
  ability: z.enum(PART_ABILITIES),
  bonus: actionExpressionSchema,
  type: z.enum(PART_TYPES),
  /** Multiplica os dados por 1/2/3/4 nos níveis 1/5/11/17. */
  scaleByLevel: z.boolean(),
  /** Dados extras por círculo acima; só em magias de 1º círculo ou acima. */
  upcast: intRange(0, 20),
});

export const actionSchema = z.strictObject({
  id: z.string().min(1).max(64),
  name: actionNameSchema,
  resolution: z.enum(ACTION_RESOLUTIONS),
  range: z.enum(ACTION_RANGES),
  attackAbility: z.enum(ACTION_ABILITIES),
  proficiency: z.enum(ACTION_PROFICIENCIES),
  attackBonus: actionExpressionSchema,
  saveAbility: z.enum(ABILITIES),
  dcMode: z.enum(DC_MODES),
  dcAdjust: intRange(-10, 10),
  dcExpression: actionExpressionSchema,
  onSuccess: z.enum(SAVE_OUTCOMES),
  /** Multiplica os ataques pelos mesmos níveis (raios da Rajada Mística). */
  scaleAttacks: z.boolean(),
  parts: z
    .array(partSchema)
    .min(1, "A ação precisa de ao menos uma parte")
    .max(MAX_PARTS_PER_ACTION, `Use no máximo ${MAX_PARTS_PER_ACTION} partes`)
    .superRefine(uniqueIds("parte")),
});

export const actionsSchema = z
  .array(actionSchema)
  .max(MAX_ACTIONS_PER_SOURCE, `Use no máximo ${MAX_ACTIONS_PER_SOURCE} ações`)
  .superRefine(uniqueIds("ação"));

export type Part = z.infer<typeof partSchema>;
export type Action = z.infer<typeof actionSchema>;

/** Parte nova: 1d6 de concussão, sem atributo. */
export function createPart(id: string, patch: Partial<Part> = {}): Part {
  return {
    id,
    count: 1,
    die: "d6",
    ability: "none",
    bonus: "0",
    type: "bludgeoning",
    scaleByLevel: false,
    upcast: 0,
    ...patch,
  };
}

/**
 * Ação nova (design G8): uma arma ataca corpo a corpo com FOR e 1d8; uma
 * magia ataca à distância com conjuração e 1d10 de energia; as outras fontes
 * atacam corpo a corpo com FOR e 1d6.
 */
export function createAction(
  source: { kind: string; category?: string },
  id: string,
): Action {
  const spell = source.kind === "spell";
  const weapon = source.kind === "item" && source.category === "weapon";
  return {
    id,
    name: "",
    resolution: "attack",
    range: spell ? "ranged" : "melee",
    attackAbility: spell ? "spellcasting" : "str",
    proficiency: "auto",
    attackBonus: "0",
    saveAbility: "dex",
    dcMode: "spell",
    dcAdjust: 0,
    dcExpression: "8 + pb",
    onSuccess: "none",
    scaleAttacks: false,
    parts: [
      createPart(
        "p1",
        spell
          ? { die: "d10", type: "force" }
          : { die: weapon ? "d8" : "d6", ability: "attack" },
      ),
    ],
  };
}
