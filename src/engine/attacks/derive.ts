import {
  ABILITY_VARIABLES,
  evaluate,
  parseExpressionCached,
} from "@/engine/effects/expression";
import type { SheetDocument } from "@/engine/sheet/document";
import { spellsByLevel } from "@/engine/sources/rules";
import type { Source } from "@/engine/sources/schema";
import {
  spellcastingFor,
  type Contribution,
  type DerivedStats,
} from "@/engine/stats/derive";
import type { Ability } from "@/engine/stats/keys";
import { deriveTraits, type Traits } from "@/engine/traits/derive";
import { tagKey } from "@/engine/traits/keys";

import type {
  Action,
  ActionAbility,
  ActionRange,
  ActionResolution,
  Die,
  PartType,
} from "./schema";

/*
 * Linhas das ações (design G3–G7): o acerto, a CD e o dano calculados com os
 * valores já resolvidos da ficha. Só exibição: nada é rolado.
 */

export type ResolvedValue = { value: number; parts: Contribution[] };

export type DamageTerm = {
  count: number;
  die: Die;
  /** Modificador do atributo + bônus da parte. */
  modifier: number;
  type: PartType;
  /** Dados extras por círculo acima; 0 quando não se aplica. */
  upcast: number;
};

export type ActionLine = {
  sourceId: string;
  sourceName: string;
  actionId: string;
  name: string;
  resolution: ActionResolution;
  range: ActionRange;
  toHit: ResolvedValue | null;
  dc: ResolvedValue | null;
  saveAbility: Ability | null;
  onSuccess: Action["onSuccess"] | null;
  /** Quantos ataques a ação faz (escala de ataques). */
  attacks: number;
  parts: DamageTerm[];
};

export type ActionContext = {
  stats: DerivedStats;
  level: number;
  exhaustion: number;
  /** Chaves das proficiências com armas: categorias e `tag:` + nome. */
  weaponKeys: Set<string>;
};

const ABILITY_SHORT = Object.fromEntries(
  Object.entries(ABILITY_VARIABLES).map(([short, ability]) => [
    ability,
    short.toUpperCase(),
  ]),
) as Record<Ability, string>;

export function actionContext(
  document: SheetDocument,
  stats: DerivedStats,
  traits: Traits = deriveTraits(document),
): ActionContext {
  return {
    stats,
    level: document.identity.level,
    exhaustion: document.exhaustion,
    weaponKeys: new Set(traits.weapons.map((entry) => entry.key)),
  };
}

/** Multiplicador dos níveis 1/5/11/17 (truques, Sopro, Rajada Mística). */
export function levelMultiplier(level: number): number {
  return 1 + Number(level >= 5) + Number(level >= 11) + Number(level >= 17);
}

/** Proficiência da ação (design G3). */
export function isProficient(
  action: Action,
  source: Source,
  weaponKeys: ReadonlySet<string>,
): boolean {
  if (action.proficiency !== "auto") return action.proficiency === "always";
  if (source.kind !== "item" || source.category !== "weapon") return true;
  return (
    weaponKeys.has(source.weaponCategory) ||
    weaponKeys.has(`tag:${tagKey(source.name)}`)
  );
}

/** Atributo de conjuração da fonte: o próprio da magia ou o da ficha. */
function spellcastingAbilityOf(
  source: Source,
  context: ActionContext,
): Ability | null {
  if (source.kind === "spell" && source.castingAbility !== "sheet") {
    return source.castingAbility;
  }
  return context.stats.variables.spellcastingAbility;
}

function evaluateText(text: string, context: ActionContext): number {
  const parsed = parseExpressionCached(text);
  if (!parsed.ok) return 0;
  try {
    return evaluate(parsed.expression, context.stats.variables);
  } catch {
    return 0;
  }
}

type ResolvedAbility = { ability: Ability | null; label: string };

/** Atributo concreto de um atributo da ação, com o rótulo da parcela. */
function resolveAbility(
  ability: ActionAbility,
  source: Source,
  context: ActionContext,
): ResolvedAbility {
  const mod = (a: Ability) => context.stats.values[`mod.${a}`].value;
  switch (ability) {
    case "none":
      return { ability: null, label: "Sem atributo" };
    case "finesse": {
      const chosen = mod("str") > mod("dex") ? "str" : "dex";
      return { ability: chosen, label: `Acuidade (${ABILITY_SHORT[chosen]})` };
    }
    case "spellcasting": {
      const chosen = spellcastingAbilityOf(source, context);
      return {
        ability: chosen,
        label: chosen
          ? `Conjuração (${ABILITY_SHORT[chosen]})`
          : "Sem atributo de conjuração",
      };
    }
    default:
      return { ability, label: `Modificador de ${ABILITY_SHORT[ability]}` };
  }
}

function modifierOf(resolved: ResolvedAbility, context: ActionContext) {
  return resolved.ability
    ? context.stats.values[`mod.${resolved.ability}`].value
    : 0;
}

/** Ataque mágico e CD de magia da fonte, já com valor manual (G4, G5). */
function spellValues(source: Source, context: ActionContext) {
  const { stats } = context;
  if (source.kind === "spell" && source.castingAbility !== "sheet") {
    return spellcastingFor(stats, source.castingAbility);
  }
  return {
    attack: stats.values.spellAttack.value,
    saveDc: stats.values.spellSaveDc.value,
  };
}

function withBonus(
  base: Contribution[],
  bonus: number,
  label: string,
): ResolvedValue {
  const parts =
    bonus !== 0
      ? [...base, { label, amount: bonus, kind: "add" as const }]
      : base;
  return { value: parts.reduce((sum, part) => sum + part.amount, 0), parts };
}

function toHitOf(
  action: Action,
  source: Source,
  context: ActionContext,
  attackAbility: ResolvedAbility,
): ResolvedValue {
  const bonus = evaluateText(action.attackBonus, context);
  // Caminho da conjuração: o ataque mágico já traz efeitos e Exaustão.
  if (
    action.attackAbility === "spellcasting" &&
    action.proficiency === "auto"
  ) {
    const attack = spellValues(source, context).attack;
    return withBonus(
      [{ label: "Ataque mágico", amount: attack, kind: "base" }],
      bonus,
      "Bônus da ação",
    );
  }
  const parts: Contribution[] = [
    {
      label: attackAbility.label,
      amount: modifierOf(attackAbility, context),
      kind: "base",
    },
  ];
  if (isProficient(action, source, context.weaponKeys)) {
    parts.push({
      label: "Proficiência",
      amount: context.stats.values.proficiencyBonus.value,
      kind: "proficiency",
    });
  }
  if (bonus !== 0) {
    parts.push({ label: "Bônus da ação", amount: bonus, kind: "add" });
  }
  if (context.exhaustion > 0) {
    parts.push({
      label: `Exaustão ${context.exhaustion}`,
      amount: context.stats.exhaustionPenalty,
      kind: "add",
    });
  }
  return { value: parts.reduce((sum, part) => sum + part.amount, 0), parts };
}

function dcOf(
  action: Action,
  source: Source,
  context: ActionContext,
): ResolvedValue {
  if (action.dcMode === "expression") {
    const value = evaluateText(action.dcExpression, context);
    return {
      value,
      parts: [{ label: action.dcExpression, amount: value, kind: "base" }],
    };
  }
  return withBonus(
    [
      {
        label: "CD de magia",
        amount: spellValues(source, context).saveDc,
        kind: "base",
      },
    ],
    action.dcAdjust,
    "Ajuste",
  );
}

/** Linha de uma ação da fonte. */
export function deriveActionLine(
  action: Action,
  source: Source,
  context: ActionContext,
): ActionLine {
  const multiplier = levelMultiplier(context.level);
  const isAttack = action.resolution === "attack";
  const attackAbility = resolveAbility(action.attackAbility, source, context);
  const upcastApplies = source.kind === "spell" && source.level >= 1;

  const parts = action.parts.map((part): DamageTerm => {
    const ability =
      part.ability === "attack"
        ? isAttack
          ? attackAbility
          : resolveAbility("none", source, context)
        : resolveAbility(part.ability, source, context);
    return {
      count: part.count * (part.scaleByLevel ? multiplier : 1),
      die: part.die,
      modifier:
        modifierOf(ability, context) + evaluateText(part.bonus, context),
      type: part.type,
      upcast: upcastApplies ? part.upcast : 0,
    };
  });

  return {
    sourceId: source.id,
    sourceName: source.name,
    actionId: action.id,
    name: action.name,
    resolution: action.resolution,
    range: action.range,
    toHit: isAttack ? toHitOf(action, source, context, attackAbility) : null,
    dc: action.resolution === "save" ? dcOf(action, source, context) : null,
    saveAbility: action.resolution === "save" ? action.saveAbility : null,
    onSuccess: action.resolution === "save" ? action.onSuccess : null,
    attacks: action.scaleAttacks ? multiplier : 1,
    parts,
  };
}

/** Linhas de todas as ações de uma fonte, para o cartão da fonte. */
export function deriveSourceActions(
  source: Source,
  context: ActionContext,
): ActionLine[] {
  return source.actions.map((action) =>
    deriveActionLine(action, source, context),
  );
}

/**
 * Fontes da lista Ataques (G7): itens equipados, talentos e traços, truques e
 * magias preparadas ou sempre preparadas, nessa ordem.
 */
export function attackListSources(sources: readonly Source[]): Source[] {
  const items = sources.filter(
    (source) => source.kind === "item" && source.equipped,
  );
  const features = sources.filter(
    (source) => source.kind === "feat" || source.kind === "trait",
  );
  const spells = spellsByLevel(sources).flatMap((group) =>
    group.spells.filter(
      (spell) => spell.level === 0 || spell.preparation !== "none",
    ),
  );
  return [...items, ...features, ...spells];
}

/** Linhas da lista Ataques. */
export function deriveAttackList(
  document: SheetDocument,
  stats: DerivedStats,
  traits?: Traits,
): ActionLine[] {
  const context = actionContext(document, stats, traits);
  return attackListSources(document.sources).flatMap((source) =>
    deriveSourceActions(source, context),
  );
}
