import { abilityModifier } from "@/engine/abilities";
import {
  deriveActionLine,
  type ActionContext,
  type ActionHost,
  type ActionLine,
} from "@/engine/attacks/derive";
import {
  EvaluationError,
  evaluate,
  parseExpressionCached,
  type ExpressionVariables,
} from "@/engine/effects/expression";
import type { DerivedStats } from "@/engine/stats/derive";
import {
  ABILITIES,
  PROFICIENCY_MULTIPLIER,
  SKILL_ABILITY,
  SKILLS,
  type Ability,
  type Skill,
} from "@/engine/stats/keys";

import type { Companion } from "./schema";

/*
 * Valores calculados do companheiro (design H3): atributos da criatura, PB do
 * dono ou próprio, e o bloco por expressões com as variáveis do dono.
 */

export type CheckValue = { value: number; multiplier: number };

/** Resultado de uma expressão do bloco: erro ou negativo vale 0. */
export type BlockValue = { value: number; error?: string };

export type CompanionStats = {
  variables: ExpressionVariables;
  pb: number;
  /** Círculo efetivo da invocação; null sem invocação. */
  spellLevel: number | null;
  mods: Record<Ability, number>;
  saves: Record<Ability, CheckValue>;
  skills: Record<Skill, CheckValue>;
  passivePerception: number;
  initiative: number;
  armorClass: BlockValue;
  hitPointsMax: BlockValue;
  hitDiceMax: BlockValue;
  hitPointsCurrent: number;
  hitDiceAvailable: number;
  /** Com 0 PV, o companheiro está caído. */
  down: boolean;
};

/** Círculo usado no cálculo: o atual, nunca abaixo do mínimo (H1). */
export function effectiveSpellLevel(companion: Companion): number | null {
  const { enabled, minLevel, level } = companion.summon;
  return enabled ? Math.max(level, minLevel) : null;
}

export function blockValue(
  text: string,
  variables: ExpressionVariables,
): BlockValue {
  const parsed = parseExpressionCached(text, "companion");
  if (!parsed.ok) return { value: 0, error: parsed.error };
  try {
    return { value: Math.max(0, evaluate(parsed.expression, variables)) };
  } catch (error) {
    if (!(error instanceof EvaluationError)) throw error;
    return { value: 0, error: error.message };
  }
}

/** Variáveis das expressões do companheiro, com as do dono (H2). */
export function companionVariables(
  companion: Companion,
  ownerStats: DerivedStats,
): ExpressionVariables {
  const owner = ownerStats.variables;
  const mods = Object.fromEntries(
    ABILITIES.map((ability) => [
      ability,
      abilityModifier(companion.abilities[ability]),
    ]),
  ) as Record<Ability, number>;
  return {
    scores: { ...companion.abilities },
    mods,
    level: owner.level,
    pb:
      companion.pbMode === "owner"
        ? ownerStats.values.proficiencyBonus.value
        : companion.pb,
    spellcastingAbility: owner.spellcastingAbility,
    owner,
    spellLevel: effectiveSpellLevel(companion) ?? undefined,
  };
}

export function deriveCompanion(
  companion: Companion,
  ownerStats: DerivedStats,
): CompanionStats {
  const variables = companionVariables(companion, ownerStats);
  const { mods, pb } = variables;

  const saves = Object.fromEntries(
    ABILITIES.map((ability) => {
      const multiplier = Number(
        companion.savingThrows[ability] || companion.allChecks,
      );
      return [ability, { value: mods[ability] + pb * multiplier, multiplier }];
    }),
  ) as Record<Ability, CheckValue>;

  const skills = Object.fromEntries(
    SKILLS.map((skill) => {
      const marked = PROFICIENCY_MULTIPLIER[companion.skills[skill]];
      const multiplier = companion.allChecks ? Math.max(1, marked) : marked;
      return [
        skill,
        { value: mods[SKILL_ABILITY[skill]] + pb * multiplier, multiplier },
      ];
    }),
  ) as Record<Skill, CheckValue>;

  const armorClass = blockValue(companion.armorClass, variables);
  const hitPointsMax = blockValue(companion.hitPointsMax, variables);
  const hitDiceMax = blockValue(companion.hitDiceCount, variables);
  const hitPointsCurrent = Math.max(0, hitPointsMax.value - companion.damage);

  return {
    variables,
    pb,
    spellLevel: variables.spellLevel ?? null,
    mods,
    saves,
    skills,
    passivePerception: 10 + skills.perception.value,
    initiative: mods.dex,
    armorClass,
    hitPointsMax,
    hitDiceMax,
    hitPointsCurrent,
    hitDiceAvailable: Math.max(0, hitDiceMax.value - companion.hitDiceSpent),
    down: hitPointsCurrent === 0,
  };
}

/**
 * Contexto das ações do companheiro (H4): atributos e PB da criatura,
 * conjuração e nível do dono, sem Exaustão.
 */
export function companionActionContext(
  stats: CompanionStats,
  ownerStats: DerivedStats,
): ActionContext {
  return {
    mods: stats.mods,
    pb: stats.pb,
    spell: {
      ability: ownerStats.variables.spellcastingAbility,
      attack: ownerStats.values.spellAttack.value,
      saveDc: ownerStats.values.spellSaveDc.value,
    },
    exhaustion: 0,
    exhaustionPenalty: 0,
    level: ownerStats.variables.level,
    variables: stats.variables,
    weaponKeys: new Set(),
    host: "companion",
    stats: null,
  };
}

/** O companheiro como dono de ações: sempre proficiente, sem círculo. */
export function companionHost(
  companion: Companion,
  context: ActionContext,
): ActionHost {
  return {
    id: companion.id,
    name: companion.name,
    autoProficient: true,
    upcastApplies: false,
    spell: context.spell,
  };
}

/** Linhas das ações do companheiro, para o cartão dele. */
export function deriveCompanionActions(
  companion: Companion,
  stats: CompanionStats,
  ownerStats: DerivedStats,
): ActionLine[] {
  const context = companionActionContext(stats, ownerStats);
  const host = companionHost(companion, context);
  return companion.actions.map((action) =>
    deriveActionLine(action, host, context),
  );
}
