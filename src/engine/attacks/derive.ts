import {
  ABILITY_VARIABLES,
  evaluate,
  parseExpressionCached,
  scopeOf,
  type ExpressionVariables,
} from "@/engine/effects/expression";
import type { SheetDocument } from "@/engine/sheet/document";
import { spellsByLevel } from "@/engine/sources/rules";
import type { Source } from "@/engine/sources/schema";
import {
  spellcastingFor,
  type Contribution,
  type DerivedStats,
} from "@/engine/stats/derive";
import { ABILITIES, type Ability } from "@/engine/stats/keys";
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
  /** Descrição livre da ação (design H9). */
  description: string;
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

/** Atributo, ataque mágico e CD de conjuração já resolvidos. */
export type SpellValues = {
  ability: Ability | null;
  attack: number;
  saveDc: number;
};

/**
 * Valores resolvidos para calcular as ações (design H4): os da ficha, ou os
 * da criatura com a conjuração do dono no companheiro.
 */
export type ActionContext = {
  mods: Record<Ability, number>;
  pb: number;
  /** Conjuração padrão: a da ficha, ou a do dono no companheiro. */
  spell: SpellValues;
  exhaustion: number;
  exhaustionPenalty: number;
  /** Nível para a escala dos níveis 5/11/17. */
  level: number;
  variables: ExpressionVariables;
  /** Chaves das proficiências com armas: categorias e `tag:` + nome. */
  weaponKeys: Set<string>;
  host: "sheet" | "companion";
  /** Valores da ficha, para as magias com atributo próprio; null no companheiro. */
  stats: DerivedStats | null;
};

/** Dono das ações: uma fonte da ficha ou um companheiro (design H4). */
export type ActionHost = {
  id: string;
  name: string;
  /** Proficiência da ação com `proficiency = auto`. */
  autoProficient: boolean;
  /** Dados por círculo valem só em magias de círculo 1 ou acima. */
  upcastApplies: boolean;
  spell: SpellValues;
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
    mods: Object.fromEntries(
      ABILITIES.map((ability) => [
        ability,
        stats.values[`mod.${ability}`].value,
      ]),
    ) as Record<Ability, number>,
    pb: stats.values.proficiencyBonus.value,
    spell: {
      ability: stats.variables.spellcastingAbility,
      attack: stats.values.spellAttack.value,
      saveDc: stats.values.spellSaveDc.value,
    },
    exhaustion: document.exhaustion,
    exhaustionPenalty: stats.exhaustionPenalty,
    level: document.identity.level,
    variables: stats.variables,
    weaponKeys: new Set(traits.weapons.map((entry) => entry.key)),
    host: "sheet",
    stats,
  };
}

/** Multiplicador dos níveis 1/5/11/17 (truques, Sopro, Rajada Mística). */
export function levelMultiplier(level: number): number {
  return 1 + Number(level >= 5) + Number(level >= 11) + Number(level >= 17);
}

/** Proficiência automática de uma fonte (design G3). */
function sourceAutoProficient(
  source: Source,
  weaponKeys: ReadonlySet<string>,
): boolean {
  if (source.kind !== "item" || source.category !== "weapon") return true;
  return (
    weaponKeys.has(source.weaponCategory) ||
    weaponKeys.has(`tag:${tagKey(source.name)}`)
  );
}

/** Proficiência da ação (design G3). */
export function isProficient(
  action: Action,
  source: Source,
  weaponKeys: ReadonlySet<string>,
): boolean {
  if (action.proficiency !== "auto") return action.proficiency === "always";
  return sourceAutoProficient(source, weaponKeys);
}

/**
 * Uma fonte como dono de ações: a magia com atributo próprio usa o ataque e
 * a CD dele, já com os efeitos e o valor manual (G4, G5).
 */
export function sourceHost(source: Source, context: ActionContext): ActionHost {
  const ownAbility =
    source.kind === "spell" && source.castingAbility !== "sheet"
      ? source.castingAbility
      : null;
  return {
    id: source.id,
    name: source.name,
    autoProficient: sourceAutoProficient(source, context.weaponKeys),
    upcastApplies: source.kind === "spell" && source.level >= 1,
    spell:
      ownAbility && context.stats
        ? { ability: ownAbility, ...spellcastingFor(context.stats, ownAbility) }
        : context.spell,
  };
}

function evaluateText(text: string, context: ActionContext): number {
  const parsed = parseExpressionCached(text, scopeOf(context.variables));
  if (!parsed.ok) return 0;
  try {
    return evaluate(parsed.expression, context.variables);
  } catch {
    return 0;
  }
}

type ResolvedAbility = { ability: Ability | null; label: string };

/** Atributo concreto de um atributo da ação, com o rótulo da parcela. */
function resolveAbility(
  ability: ActionAbility,
  host: ActionHost,
  context: ActionContext,
): ResolvedAbility {
  const { mods } = context;
  switch (ability) {
    case "none":
      return { ability: null, label: "Sem atributo" };
    case "finesse": {
      const chosen = mods.str > mods.dex ? "str" : "dex";
      return { ability: chosen, label: `Acuidade (${ABILITY_SHORT[chosen]})` };
    }
    case "spellcasting": {
      const chosen = host.spell.ability;
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

/**
 * Modificador do atributo resolvido. A conjuração no companheiro é do dono,
 * então o modificador vem das variáveis do dono.
 */
function modifierOf(
  resolved: ResolvedAbility,
  requested: ActionAbility,
  context: ActionContext,
): number {
  if (!resolved.ability) return 0;
  const owner = context.variables.owner;
  if (requested === "spellcasting" && owner) {
    return owner.mods[resolved.ability];
  }
  return context.mods[resolved.ability];
}

/** Sufixo dos rótulos de conjuração no companheiro. */
function spellLabel(label: string, context: ActionContext): string {
  return context.host === "companion" ? `${label} do dono` : label;
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
  host: ActionHost,
  context: ActionContext,
  attackAbility: ResolvedAbility,
): ResolvedValue {
  const bonus = evaluateText(action.attackBonus, context);
  // Caminho da conjuração: o ataque mágico já traz efeitos e Exaustão.
  if (
    action.attackAbility === "spellcasting" &&
    action.proficiency === "auto"
  ) {
    return withBonus(
      [
        {
          label: spellLabel("Ataque mágico", context),
          amount: host.spell.attack,
          kind: "base",
        },
      ],
      bonus,
      "Bônus da ação",
    );
  }
  const parts: Contribution[] = [
    {
      label: attackAbility.label,
      amount: modifierOf(attackAbility, action.attackAbility, context),
      kind: "base",
    },
  ];
  const proficient =
    action.proficiency === "auto"
      ? host.autoProficient
      : action.proficiency === "always";
  if (proficient) {
    parts.push({
      label: "Proficiência",
      amount: context.pb,
      kind: "proficiency",
    });
  }
  if (bonus !== 0) {
    parts.push({ label: "Bônus da ação", amount: bonus, kind: "add" });
  }
  if (context.exhaustion > 0) {
    parts.push({
      label: `Exaustão ${context.exhaustion}`,
      amount: context.exhaustionPenalty,
      kind: "add",
    });
  }
  return { value: parts.reduce((sum, part) => sum + part.amount, 0), parts };
}

function dcOf(
  action: Action,
  host: ActionHost,
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
        label: spellLabel("CD de magia", context),
        amount: host.spell.saveDc,
        kind: "base",
      },
    ],
    action.dcAdjust,
    "Ajuste",
  );
}

/** Linha de uma ação de uma fonte ou de um companheiro. */
export function deriveActionLine(
  action: Action,
  host: ActionHost,
  context: ActionContext,
): ActionLine {
  const multiplier = levelMultiplier(context.level);
  const isAttack = action.resolution === "attack";
  const attackAbility = resolveAbility(action.attackAbility, host, context);

  const parts = action.parts.map((part): DamageTerm => {
    const requested: ActionAbility =
      part.ability === "attack"
        ? isAttack
          ? action.attackAbility
          : "none"
        : part.ability;
    const ability =
      part.ability === "attack" && isAttack
        ? attackAbility
        : resolveAbility(requested, host, context);
    return {
      count: part.count * (part.scaleByLevel ? multiplier : 1),
      die: part.die,
      modifier:
        modifierOf(ability, requested, context) +
        evaluateText(part.bonus, context),
      type: part.type,
      upcast: host.upcastApplies ? part.upcast : 0,
    };
  });

  return {
    sourceId: host.id,
    sourceName: host.name,
    actionId: action.id,
    name: action.name,
    description: action.description,
    resolution: action.resolution,
    range: action.range,
    toHit: isAttack ? toHitOf(action, host, context, attackAbility) : null,
    dc: action.resolution === "save" ? dcOf(action, host, context) : null,
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
  const host = sourceHost(source, context);
  return source.actions.map((action) =>
    deriveActionLine(action, host, context),
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
