"use client";

import { useState } from "react";

import { Button, TextField } from "@/components/form";
import type { ExpressionVariables } from "@/engine/effects/expression";
import { createEffect, type Effect } from "@/engine/effects/schema";
import {
  EFFECT_PROFICIENCIES,
  GRANT_VALUES,
  MAX_EFFECTS_PER_SOURCE,
  grantValueError,
  isGrantTarget,
  operationsFor,
  usesExpression,
  type EffectOperation,
  type EffectTarget,
  type GrantTarget,
} from "@/engine/effects/targets";

import {
  EFFECT_PROFICIENCY_LABEL,
  GRANT_SUGGESTIONS,
  OPERATION_LABEL,
  TARGET_GROUPS,
  defaultGrantValue,
  grantClosedLabel,
  grantValueLabel,
  targetOptionLabel,
} from "./effect-labels";
import { ExpressionField } from "./expression-field";

const SELECT = "rounded-md border border-line bg-bg px-2 py-2 text-sm";

/**
 * Valor de "conceder" (design T1): seleção nas listas fechadas; texto com
 * sugestões nas livres, gravado só quando válido. Em armas, digitar
 * "Simples" ou "Marciais" grava a categoria.
 */
function GrantValueField({
  target,
  name,
  value,
  onCommit,
}: {
  target: GrantTarget;
  name: string;
  value: string;
  onCommit: (value: string) => void;
}) {
  const { values, free } = GRANT_VALUES[target];
  const [raw, setRaw] = useState(grantValueLabel(target, value));

  if (!free) {
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={name} className="text-sm font-medium">
          Valor
        </label>
        <select
          id={name}
          value={value}
          onChange={(event) => onCommit(event.target.value)}
          className={SELECT}
        >
          {values.map((option) => (
            <option key={option} value={option}>
              {grantClosedLabel(target, option)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const closedLabels = values.map((option) => grantClosedLabel(target, option));
  const toValue = (text: string) => {
    const index = closedLabels.findIndex(
      (label) =>
        label.toLocaleLowerCase("pt-BR") ===
        text.trim().toLocaleLowerCase("pt-BR"),
    );
    return index >= 0 ? values[index]! : text.trim();
  };
  const error = grantValueError(target, toValue(raw)) ?? undefined;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <TextField
        label="Valor"
        name={name}
        value={raw}
        error={error}
        autoComplete="off"
        list={`${name}-suggestions`}
        onChange={(event) => {
          const text = event.target.value;
          setRaw(text);
          const next = toValue(text);
          if (!grantValueError(target, next) && next !== value) onCommit(next);
        }}
      />
      <datalist id={`${name}-suggestions`}>
        {[...closedLabels, ...(GRANT_SUGGESTIONS[target] ?? [])].map(
          (suggestion) => (
            <option key={suggestion} value={suggestion} />
          ),
        )}
      </datalist>
    </div>
  );
}

function EffectRow({
  effect,
  index,
  sourceId,
  variables,
  onChange,
  onRemove,
}: {
  effect: Effect;
  index: number;
  sourceId: string;
  variables: ExpressionVariables;
  onChange: (effect: Effect) => void;
  onRemove: () => void;
}) {
  const field = (name: string) => `effect-${sourceId}-${effect.id}-${name}`;
  const operations = operationsFor(effect.target);

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-line p-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-40 flex-col gap-1">
          <label htmlFor={field("target")} className="text-sm font-medium">
            Alvo
          </label>
          <select
            id={field("target")}
            value={effect.target}
            onChange={(event) => {
              const target = event.target.value as EffectTarget;
              const allowed = operationsFor(target);
              // Mantém a operação se ela ainda vale para o novo alvo; num
              // alvo de "conceder", o valor precisa servir ao alvo.
              const value =
                isGrantTarget(target) && grantValueError(target, effect.value)
                  ? defaultGrantValue(target)
                  : effect.value;
              onChange({
                ...effect,
                target,
                op: allowed.includes(effect.op) ? effect.op : allowed[0]!,
                value,
              });
            }}
            className={SELECT}
          >
            {TARGET_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.targets.map((target) => (
                  <option key={target} value={target}>
                    {targetOptionLabel(target)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={field("op")} className="text-sm font-medium">
            Operação
          </label>
          <select
            id={field("op")}
            value={effect.op}
            onChange={(event) =>
              onChange({ ...effect, op: event.target.value as EffectOperation })
            }
            className={SELECT}
          >
            {operations.map((op) => (
              <option key={op} value={op}>
                {OPERATION_LABEL[op]}
              </option>
            ))}
          </select>
        </div>
        {effect.op === "grant" && isGrantTarget(effect.target) ? (
          <GrantValueField
            // Novo campo ao trocar de alvo, para o texto não ficar do anterior.
            key={effect.target}
            target={effect.target}
            name={field("value")}
            value={effect.value}
            onCommit={(value) => onChange({ ...effect, value })}
          />
        ) : usesExpression(effect.op) ? (
          <ExpressionField
            label="Valor"
            placeholder="ex.: 10 + des.mod + con.mod"
            name={field("expression")}
            value={effect.expression}
            variables={variables}
            onCommit={(expression) => onChange({ ...effect, expression })}
          />
        ) : (
          <div className="flex flex-col gap-1">
            <label
              htmlFor={field("proficiency")}
              className="text-sm font-medium"
            >
              Nível
            </label>
            <select
              id={field("proficiency")}
              value={effect.proficiency}
              onChange={(event) =>
                onChange({
                  ...effect,
                  proficiency: event.target.value as Effect["proficiency"],
                })
              }
              className={SELECT}
            >
              {EFFECT_PROFICIENCIES.map((level) => (
                <option key={level} value={level}>
                  {EFFECT_PROFICIENCY_LABEL[level]}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={effect.noArmor}
            onChange={(event) =>
              onChange({ ...effect, noArmor: event.target.checked })
            }
            className="size-4 accent-accent"
          />
          Só sem armadura
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={effect.noShield}
            onChange={(event) =>
              onChange({ ...effect, noShield: event.target.checked })
            }
            className="size-4 accent-accent"
          />
          Só sem escudo
        </label>
        <Button
          type="button"
          variant="secondary"
          className="ml-auto"
          aria-label={`Remover efeito ${index + 1}`}
          onClick={onRemove}
        >
          Remover
        </Button>
      </div>
    </li>
  );
}

const VARIABLES_HINT =
  "Variáveis: for, des, con, int, sab, car (valores), for.mod … car.mod (modificadores), nivel, pb e conj.mod (modificador de conjuração). Operações: + - * / (divisão para baixo), parênteses, min(…) e max(…).";

/** Lista de efeitos de uma fonte, com até 20 (design E7). */
export function EffectsEditor({
  sourceId,
  effects,
  variables,
  onChange,
}: {
  sourceId: string;
  effects: Effect[];
  variables: ExpressionVariables;
  onChange: (effects: Effect[]) => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">Efeitos</h4>
        <Button
          type="button"
          variant="secondary"
          disabled={effects.length >= MAX_EFFECTS_PER_SOURCE}
          onClick={() =>
            onChange([...effects, createEffect(crypto.randomUUID())])
          }
        >
          Adicionar efeito
        </Button>
      </div>
      <p className="text-xs text-muted">{VARIABLES_HINT}</p>
      {effects.length === 0 ? (
        <p className="text-sm text-muted">Sem efeitos.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {effects.map((effect, index) => (
            <EffectRow
              key={effect.id}
              effect={effect}
              index={index}
              sourceId={sourceId}
              variables={variables}
              onChange={(next) =>
                onChange(effects.map((e) => (e.id === effect.id ? next : e)))
              }
              onRemove={() =>
                onChange(effects.filter((e) => e.id !== effect.id))
              }
            />
          ))}
        </ul>
      )}
    </section>
  );
}
