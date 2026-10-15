import { abilityModifier } from "@/engine/abilities";
import {
  collectActiveEffects,
  type ActiveEffect,
} from "@/engine/effects/collect";
import {
  ABILITY_VARIABLES,
  EvaluationError,
  evaluate,
  parseExpressionCached,
  referencedAbilities,
  type ExpressionVariables,
} from "@/engine/effects/expression";
import {
  EFFECT_PROFICIENCY_MULTIPLIER,
  type EffectTarget,
} from "@/engine/effects/targets";
import type { SheetDocument } from "@/engine/sheet/document";
import type { Item } from "@/engine/sources/schema";

import {
  ABILITIES,
  PROFICIENCY_MULTIPLIER,
  SKILLS,
  SKILL_ABILITY,
  proficiencyBonusForLevel,
  type Ability,
  type DerivedKey,
} from "./keys";

/** Uma parcela de um valor: a base, um efeito, uma proficiência... (design E5) */
export type Contribution = {
  label: string;
  amount: number;
  kind: "base" | "add" | "set" | "proficiency" | "unused";
};

/** Um valor derivado: o que vale, o que o cálculo daria e se há override. */
export type DerivedValue = {
  value: number;
  calculated: number;
  overridden: boolean;
  parts: Contribution[];
};

export type AbilityScore = {
  value: number;
  base: number;
  parts: Contribution[];
};

/** Efeito ignorado no cálculo, com o motivo (design E3). */
export type EffectIssue = {
  sourceId: string;
  effectId: string;
  reason: "cycle" | "error";
  message: string;
};

export type DerivedStats = {
  values: Record<DerivedKey, DerivedValue>;
  abilityScores: Record<Ability, AbilityScore>;
  issues: EffectIssue[];
  /** Variáveis das expressões, para a pré-visualização no editor de efeitos. */
  variables: ExpressionVariables;
  /** PV máximo menos o dano sofrido, sem passar de 0 (design S3). */
  hitPointsCurrent: number;
  /** Total de dados de vida menos os gastos, sem passar de 0. */
  hitDiceAvailable: number;
  /**
   * Soma dos efeitos de CD de magia e de ataque mágico, para as magias com
   * atributo próprio (design K3).
   */
  spellEffects: { saveDc: number; attack: number };
};

/** PV máximo pela média fixa do 5.5e, com mínimo de 1 PV por nível. */
export function hitPointsMaxFor(
  hitDie: number,
  level: number,
  conModifier: number,
): number {
  const first = Math.max(1, hitDie + conModifier);
  const perLevel = Math.max(1, hitDie / 2 + 1 + conModifier);
  return first + (level - 1) * perLevel;
}

const ABILITY_SHORT = Object.fromEntries(
  Object.entries(ABILITY_VARIABLES).map(([short, ability]) => [
    ability,
    short.toUpperCase(),
  ]),
) as Record<Ability, string>;

/** Armadura leve: base + DES; média: base + DES até +2; pesada: só a base. */
export function armorClassFor(armor: Item, dexModifier: number): number {
  switch (armor.armorType) {
    case "light":
      return armor.armorBase + dexModifier;
    case "medium":
      return armor.armorBase + Math.min(dexModifier, 2);
    case "heavy":
      return armor.armorBase;
  }
}

/**
 * Valores derivados da ficha (design E3). Ordem: PB, atributos (com efeitos,
 * em ordem topológica), modificadores, salvaguardas, perícias, iniciativa,
 * passiva, deslocamento, PV, dados de vida e CA. Cada valor passa pelo
 * override antes de ser lido pelos que dependem dele.
 */
export function deriveStats(document: SheetDocument): DerivedStats {
  const values = {} as Record<DerivedKey, DerivedValue>;
  const issues: EffectIssue[] = [];
  const { effects, armors, shields } = collectActiveEffects(document.sources);

  function resolve(
    key: DerivedKey,
    calculated: number,
    parts: Contribution[],
  ): number {
    const manual = document.overrides[key];
    const overridden = manual !== undefined;
    const value = overridden ? manual : calculated;
    values[key] = { value, calculated, overridden, parts };
    return value;
  }

  function targeting(...targets: EffectTarget[]) {
    return effects.filter((active) => targets.includes(active.effect.target));
  }

  /** Valor do efeito, ou null se a avaliação falhar (registrado em issues). */
  function evaluateEffect(
    active: ActiveEffect,
    variables: ExpressionVariables,
  ): number | null {
    const parsed = parseExpressionCached(active.effect.expression);
    if (!parsed.ok) {
      issues.push(issue(active, "error", parsed.error));
      return null;
    }
    try {
      return evaluate(parsed.expression, variables);
    } catch (error) {
      if (!(error instanceof EvaluationError)) throw error;
      issues.push(issue(active, "error", error.message));
      return null;
    }
  }

  /** Soma os efeitos de somar, devolvendo o total e as parcelas. */
  function adds(list: ActiveEffect[], variables: ExpressionVariables) {
    let total = 0;
    const parts: Contribution[] = [];
    for (const active of list) {
      if (active.effect.op !== "add") continue;
      const amount = evaluateEffect(active, variables);
      if (amount === null) continue;
      total += amount;
      parts.push({ label: active.source.name, amount, kind: "add" });
    }
    return { total, parts };
  }

  /**
   * Definir: vale o maior entre a base e os efeitos; os menores ficam como
   * "não usados" nas parcelas.
   */
  function applySets(
    base: number,
    baseLabel: string,
    list: ActiveEffect[],
    variables: ExpressionVariables,
  ) {
    const parts: Contribution[] = [
      { label: baseLabel, amount: base, kind: "base" },
    ];
    let value = base;
    for (const active of list) {
      if (active.effect.op !== "set") continue;
      const amount = evaluateEffect(active, variables);
      if (amount === null) continue;
      if (amount > value) {
        parts.forEach((part) => {
          if (part.kind === "base" || part.kind === "set") part.kind = "unused";
        });
        value = amount;
        parts.push({ label: active.source.name, amount, kind: "set" });
      } else {
        parts.push({ label: active.source.name, amount, kind: "unused" });
      }
    }
    return { value, parts };
  }

  // PB: só depende do nível.
  const { level } = document.identity;
  const pb = resolve("proficiencyBonus", proficiencyBonusForLevel(level), [
    {
      label: `Nível ${level}`,
      amount: proficiencyBonusForLevel(level),
      kind: "base",
    },
  ]);

  // Atributos: grafo das dependências entre efeitos de atributo.
  const abilityEffects = new Map<Ability, ActiveEffect[]>(
    ABILITIES.map((ability) => [
      ability,
      targeting(`ability.${ability}`).filter(
        (active) => active.effect.op === "add" || active.effect.op === "set",
      ),
    ]),
  );
  const spellcastingAbility: Ability | null =
    document.spellcastingAbility === "none"
      ? null
      : document.spellcastingAbility;
  const reads = (active: ActiveEffect): Set<Ability> => {
    const parsed = parseExpressionCached(active.effect.expression);
    return parsed.ok
      ? referencedAbilities(parsed.expression, spellcastingAbility)
      : new Set();
  };
  const edges = new Map<Ability, Set<Ability>>();
  for (const [target, list] of abilityEffects) {
    for (const active of list) {
      for (const source of reads(active)) {
        if (!edges.has(source)) edges.set(source, new Set());
        edges.get(source)!.add(target);
      }
    }
  }
  // Um efeito em X que lê Y fecha um ciclo se Y é o próprio X ou se X já
  // alcança Y: a aresta Y -> X vem do próprio efeito.
  const inCycle = (target: Ability, active: ActiveEffect) =>
    [...reads(active)].some(
      (source) => source === target || reaches(edges, target, source),
    );
  for (const [target, list] of abilityEffects) {
    abilityEffects.set(
      target,
      list.filter((active) => {
        if (!inCycle(target, active)) return true;
        issues.push(issue(active, "cycle", "Dependência circular"));
        return false;
      }),
    );
  }

  // Ordem topológica no grafo sem os efeitos do ciclo.
  const order: Ability[] = [];
  const pending = new Set<Ability>(ABILITIES);
  const dependsOn = (target: Ability) =>
    new Set(
      abilityEffects.get(target)!.flatMap((active) => [...reads(active)]),
    );
  while (pending.size > 0) {
    const ready = [...pending].filter((ability) =>
      [...dependsOn(ability)].every((source) => !pending.has(source)),
    );
    // Sem ciclos restantes, sempre há um pronto; a guarda evita laço infinito.
    const next = ready.length > 0 ? ready : [...pending];
    for (const ability of next) {
      order.push(ability);
      pending.delete(ability);
    }
  }

  const scores = { ...document.abilities };
  const mods = Object.fromEntries(
    ABILITIES.map((ability) => [ability, abilityModifier(scores[ability])]),
  ) as Record<Ability, number>;
  const abilityScores = {} as Record<Ability, AbilityScore>;
  const variables: ExpressionVariables = {
    scores,
    mods,
    level,
    pb,
    spellcastingAbility,
  };

  for (const ability of order) {
    const base = document.abilities[ability];
    const set = applySets(
      base,
      "Valor na ficha",
      abilityEffects.get(ability)!,
      variables,
    );
    const parts = set.parts;
    let value = set.value;
    const added = adds(abilityEffects.get(ability)!, variables);
    value += added.total;
    parts.push(...added.parts);
    scores[ability] = value;
    abilityScores[ability] = { value, base, parts };
    mods[ability] = resolve(`mod.${ability}`, abilityModifier(value), [
      {
        label: `${ABILITY_SHORT[ability]} ${value}`,
        amount: abilityModifier(value),
        kind: "base",
      },
    ]);
  }

  // Salvaguardas e perícias: maior multiplicador entre ficha e efeitos.
  function proficient(
    key: DerivedKey,
    modifier: number,
    modifierLabel: string,
    manual: number,
    targets: EffectTarget[],
  ) {
    const list = targeting(...targets);
    let multiplier = manual;
    let label = manual === 2 ? "Expertise" : "Proficiência";
    for (const active of list) {
      if (active.effect.op !== "proficiency") continue;
      const fromEffect =
        EFFECT_PROFICIENCY_MULTIPLIER[active.effect.proficiency];
      if (fromEffect > multiplier) {
        multiplier = fromEffect;
        label = active.source.name;
      }
    }
    const parts: Contribution[] = [
      { label: modifierLabel, amount: modifier, kind: "base" },
    ];
    const proficiencyAmount = Math.floor(multiplier * pb);
    if (multiplier > 0) {
      parts.push({ label, amount: proficiencyAmount, kind: "proficiency" });
    }
    const added = adds(list, variables);
    parts.push(...added.parts);
    resolve(key, modifier + proficiencyAmount + added.total, parts);
  }

  for (const ability of ABILITIES) {
    proficient(
      `save.${ability}`,
      mods[ability],
      `Modificador de ${ABILITY_SHORT[ability]}`,
      document.savingThrows[ability] ? 1 : 0,
      [`save.${ability}`, "save.all"],
    );
  }
  for (const skill of SKILLS) {
    const ability = SKILL_ABILITY[skill];
    proficient(
      `skill.${skill}`,
      mods[ability],
      `Modificador de ${ABILITY_SHORT[ability]}`,
      PROFICIENCY_MULTIPLIER[document.skills[skill]],
      [`skill.${skill}`, "skill.all"],
    );
  }

  // CD de magia e ataque mágico: atributo de conjuração + PB + somar (K2).
  const spellMod = spellcastingAbility ? mods[spellcastingAbility] : 0;
  const spellModPart: Contribution = {
    label: spellcastingAbility
      ? `Modificador de ${ABILITY_SHORT[spellcastingAbility]}`
      : "Sem atributo de conjuração",
    amount: spellMod,
    kind: "base",
  };
  const proficiencyPart: Contribution = {
    label: "Proficiência",
    amount: pb,
    kind: "proficiency",
  };
  const spellAttackAdds = adds(targeting("spellAttack"), variables);
  resolve("spellAttack", spellMod + pb + spellAttackAdds.total, [
    spellModPart,
    proficiencyPart,
    ...spellAttackAdds.parts,
  ]);
  const spellSaveDcAdds = adds(targeting("spellSaveDc"), variables);
  resolve("spellSaveDc", 8 + spellMod + pb + spellSaveDcAdds.total, [
    { label: "Base", amount: 8, kind: "base" },
    spellModPart,
    proficiencyPart,
    ...spellSaveDcAdds.parts,
  ]);

  /** Base + somar, para os valores sem outras operações. */
  function withAdds(
    key: DerivedKey,
    base: number,
    baseLabel: string,
    target: EffectTarget,
  ) {
    const added = adds(targeting(target), variables);
    return resolve(key, base + added.total, [
      { label: baseLabel, amount: base, kind: "base" },
      ...added.parts,
    ]);
  }

  withAdds("initiative", mods.dex, "Modificador de DES", "initiative");
  const perception = values["skill.perception"].value;
  withAdds(
    "passivePerception",
    10 + perception,
    "10 + Percepção",
    "passivePerception",
  );

  // Deslocamento: base, definir (maior) e somar.
  {
    const list = targeting("speed");
    const { value, parts } = applySets(
      document.speed,
      "Deslocamento na ficha",
      list,
      variables,
    );
    const added = adds(list, variables);
    resolve("speed", value + added.total, [...parts, ...added.parts]);
  }

  const { hitDie, damage, hitDiceSpent } = document.hitPoints;
  const hitPointsMax = withAdds(
    "hitPointsMax",
    hitPointsMaxFor(hitDie, level, mods.con),
    `d${hitDie}, nível ${level}`,
    "hitPointsMax",
  );
  const hitDiceMax = resolve("hitDiceMax", level, [
    { label: `Nível ${level}`, amount: level, kind: "base" },
  ]);

  // CA: maior base válida + escudo + somar (design E3).
  {
    const list = targeting("armorClass");
    const candidates: Contribution[] = [];
    if (armors.length === 0) {
      candidates.push({
        label: "10 + DES",
        amount: 10 + mods.dex,
        kind: "base",
      });
    }
    for (const armor of armors) {
      candidates.push({
        label: armor.name,
        amount: armorClassFor(armor, mods.dex),
        kind: "base",
      });
    }
    for (const active of list) {
      if (active.effect.op !== "altBase") continue;
      const amount = evaluateEffect(active, variables);
      if (amount === null) continue;
      candidates.push({ label: active.source.name, amount, kind: "base" });
    }
    // Sempre há ao menos uma base: 10 + DES ou a armadura.
    const best = candidates.reduce((a, b) => (b.amount > a.amount ? b : a));
    const parts = candidates.map((candidate) =>
      candidate === best
        ? candidate
        : { ...candidate, kind: "unused" as const },
    );
    let value = best.amount;
    const shield = shields.reduce<Item | null>(
      (a, b) => (a === null || b.shieldBonus > a.shieldBonus ? b : a),
      null,
    );
    if (shield) {
      value += shield.shieldBonus;
      parts.push({
        label: shield.name,
        amount: shield.shieldBonus,
        kind: "add",
      });
    }
    const added = adds(list, variables);
    parts.push(...added.parts);
    resolve("armorClass", value + added.total, parts);
  }

  return {
    values,
    abilityScores,
    issues,
    variables,
    hitPointsCurrent: Math.max(0, hitPointsMax - damage),
    hitDiceAvailable: Math.max(0, hitDiceMax - hitDiceSpent),
    spellEffects: {
      saveDc: spellSaveDcAdds.total,
      attack: spellAttackAdds.total,
    },
  };
}

/**
 * CD de magia e ataque mágico de uma magia com atributo próprio (design K3):
 * o modificador do atributo (já com valor manual), o PB e os efeitos da ficha,
 * sem o valor manual da CD e do ataque da ficha.
 */
export function spellcastingFor(
  stats: DerivedStats,
  ability: Ability,
): { saveDc: number; attack: number } {
  const mod = stats.values[`mod.${ability}`].value;
  const pb = stats.values.proficiencyBonus.value;
  return {
    saveDc: 8 + mod + pb + stats.spellEffects.saveDc,
    attack: mod + pb + stats.spellEffects.attack,
  };
}

function issue(
  active: ActiveEffect,
  reason: EffectIssue["reason"],
  message: string,
): EffectIssue {
  return {
    sourceId: active.source.id,
    effectId: active.effect.id,
    reason,
    message,
  };
}

/** Há caminho de `from` até `to` seguindo as arestas do grafo. */
function reaches(
  edges: Map<Ability, Set<Ability>>,
  from: Ability,
  to: Ability,
): boolean {
  const seen = new Set<Ability>();
  const stack = [...(edges.get(from) ?? [])];
  while (stack.length > 0) {
    const next = stack.pop()!;
    if (next === to) return true;
    if (seen.has(next)) continue;
    seen.add(next);
    stack.push(...(edges.get(next) ?? []));
  }
  return false;
}
