"use client";

import { useState } from "react";

import { Button } from "@/components/form";
import {
  ACTION_ABILITIES,
  ACTION_PROFICIENCIES,
  ACTION_RANGES,
  ACTION_RESOLUTIONS,
  DICE,
  MAX_ACTIONS_PER_SOURCE,
  MAX_PARTS_PER_ACTION,
  PART_ABILITIES,
  PART_TYPES,
  SAVE_OUTCOMES,
  actionDescriptionSchema,
  actionNameSchema,
  actionSchema,
  createPart,
  partSchema,
  type Action,
  type Part,
} from "@/engine/attacks/schema";
import type {
  ExpressionScope,
  ExpressionVariables,
} from "@/engine/effects/expression";
import { ABILITIES } from "@/engine/stats/keys";

import {
  ACTION_PROFICIENCY_LABEL,
  PART_TYPE_LABEL,
  RANGE_LABEL,
  RESOLUTION_LABEL,
  SAVE_OUTCOME_LABEL,
  actionAbilityOptions,
  formatDice,
} from "../attacks/labels";
import { ABILITY_LABEL } from "../labels";
import { NumberField } from "../number-field";
import { parseInteger } from "../parse";
import { ExpressionField } from "./expression-field";
import { SchemaTextField } from "./schema-text-field";
import { SelectField } from "./source-form";

const countSchema = partSchema.shape.count;
const dcAdjustSchema = actionSchema.shape.dcAdjust;
const upcastSchema = partSchema.shape.upcast;

function entries<K extends string>(
  labels: Record<K, string>,
  keys: readonly K[],
) {
  return keys.map((key) => [key, labels[key]] as const);
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-accent"
      />
      {label}
    </label>
  );
}

/** Resumo de uma ação recolhida: "Ataque corpo a corpo · 1d8 + 2d8". */
function actionSummary(action: Action): string {
  const mode =
    action.resolution === "attack"
      ? `Ataque ${RANGE_LABEL[action.range].toLowerCase()}`
      : action.resolution === "save"
        ? `Salvaguarda de ${ABILITY_LABEL[action.saveAbility].short}`
        : RESOLUTION_LABEL.auto;
  const dice = action.parts
    .map(
      (part) =>
        `${formatDice({ ...part, modifier: 0 })} ${PART_TYPE_LABEL[part.type]}`,
    )
    .join(" + ");
  return [action.name, mode, dice].filter(Boolean).join(" · ");
}

function PartRow({
  part,
  index,
  field,
  isAttack,
  upcastApplies,
  canRemove,
  variables,
  scope,
  onChange,
  onRemove,
}: {
  part: Part;
  index: number;
  field: (name: string) => string;
  isAttack: boolean;
  upcastApplies: boolean;
  canRemove: boolean;
  variables: ExpressionVariables;
  scope: ExpressionScope;
  onChange: (part: Part) => void;
  onRemove: () => void;
}) {
  // "O do ataque" só faz sentido em ataques; fica listado se já escolhido.
  const abilities = PART_ABILITIES.filter(
    (ability) => ability !== "attack" || isAttack || part.ability === "attack",
  );
  return (
    <li className="flex flex-col gap-3 rounded-md border border-line bg-surface-2 p-3">
      <div className="grid items-start gap-3 grid-cols-2 sm:grid-cols-[5rem_6rem_1fr_1fr]">
        <NumberField
          label="Dados"
          name={field("count")}
          inputMode="numeric"
          value={part.count}
          parse={(text) => parseInteger(text, countSchema)}
          onCommit={(count) => onChange({ ...part, count })}
        />
        <SelectField
          label="Dado"
          name={field("die")}
          value={part.die}
          options={DICE.map((die) => [die, die] as const)}
          onChange={(die) => onChange({ ...part, die })}
        />
        <SelectField
          label="Atributo"
          name={field("ability")}
          value={part.ability}
          options={actionAbilityOptions(abilities)}
          onChange={(ability) => onChange({ ...part, ability })}
        />
        <SelectField
          label="Tipo"
          name={field("type")}
          value={part.type}
          options={entries(PART_TYPE_LABEL, PART_TYPES)}
          onChange={(type) => onChange({ ...part, type })}
        />
      </div>
      <div className="grid items-start gap-3 sm:grid-cols-[1fr_8rem]">
        <ExpressionField
          label="Bônus"
          name={field("bonus")}
          value={part.bonus}
          placeholder="ex.: 1"
          variables={variables}
          scope={scope}
          onCommit={(bonus) => onChange({ ...part, bonus })}
        />
        {upcastApplies && (
          <NumberField
            label="Dados por círculo"
            name={field("upcast")}
            inputMode="numeric"
            value={part.upcast}
            parse={(text) => parseInteger(text, upcastSchema)}
            onCommit={(upcast) => onChange({ ...part, upcast })}
          />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Check
          label="Dados crescem nos níveis 5, 11 e 17"
          checked={part.scaleByLevel}
          onChange={(scaleByLevel) => onChange({ ...part, scaleByLevel })}
        />
        <Button
          type="button"
          variant="secondary"
          className="ml-auto py-1"
          disabled={!canRemove}
          aria-label={`Remover parte ${index + 1}`}
          onClick={onRemove}
        >
          Remover parte
        </Button>
      </div>
    </li>
  );
}

function ActionRow({
  action,
  index,
  total,
  ownerId,
  upcastApplies,
  open,
  variables,
  scope,
  onToggle,
  onChange,
  onMove,
  onRemove,
}: {
  action: Action;
  index: number;
  total: number;
  ownerId: string;
  upcastApplies: boolean;
  open: boolean;
  variables: ExpressionVariables;
  scope: ExpressionScope;
  onToggle: () => void;
  onChange: (action: Action) => void;
  onMove: (offset: -1 | 1) => void;
  onRemove: () => void;
}) {
  const field = (name: string) => `action-${ownerId}-${action.id}-${name}`;
  const isAttack = action.resolution === "attack";
  const replacePart = (next: Part) =>
    onChange({
      ...action,
      parts: action.parts.map((p) => (p.id === next.id ? next : p)),
    });

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-line p-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggle}
          className="min-w-0 flex-1 truncate text-left text-sm font-medium hover:underline"
        >
          <span aria-hidden>{open ? "▾" : "▸"} </span>
          {actionSummary(action)}
        </button>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="secondary"
            className="px-2 py-1"
            aria-label={`Subir ação ${index + 1}`}
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            ↑
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="px-2 py-1"
            aria-label={`Descer ação ${index + 1}`}
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          >
            ↓
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="py-1"
            aria-label={`Remover ação ${index + 1}`}
            onClick={onRemove}
          >
            Remover
          </Button>
        </div>
      </div>

      {open && (
        <>
          <div className="grid items-start gap-3 sm:grid-cols-3">
            <SchemaTextField
              label="Nome da ação"
              name={field("name")}
              value={action.name}
              schema={actionNameSchema}
              placeholder="ex.: Duas mãos"
              onCommit={(name) => onChange({ ...action, name })}
            />
            <SelectField
              label="Resolução"
              name={field("resolution")}
              value={action.resolution}
              options={entries(RESOLUTION_LABEL, ACTION_RESOLUTIONS)}
              onChange={(resolution) => onChange({ ...action, resolution })}
            />
            {isAttack && (
              <SelectField
                label="Alcance"
                name={field("range")}
                value={action.range}
                options={entries(RANGE_LABEL, ACTION_RANGES)}
                onChange={(range) => onChange({ ...action, range })}
              />
            )}
          </div>

          {isAttack && (
            <div className="grid items-start gap-3 sm:grid-cols-3">
              <SelectField
                label="Atributo do acerto"
                name={field("attackAbility")}
                value={action.attackAbility}
                options={actionAbilityOptions(ACTION_ABILITIES)}
                onChange={(attackAbility) =>
                  onChange({ ...action, attackAbility })
                }
              />
              <SelectField
                label="Proficiência"
                name={field("proficiency")}
                value={action.proficiency}
                options={entries(
                  ACTION_PROFICIENCY_LABEL,
                  ACTION_PROFICIENCIES,
                )}
                onChange={(proficiency) => onChange({ ...action, proficiency })}
              />
              <ExpressionField
                label="Bônus no acerto"
                name={field("attackBonus")}
                value={action.attackBonus}
                placeholder="ex.: 1"
                variables={variables}
                scope={scope}
                onCommit={(attackBonus) => onChange({ ...action, attackBonus })}
              />
            </div>
          )}

          {action.resolution === "save" && (
            <div className="grid items-start gap-3 sm:grid-cols-4">
              <SelectField
                label="Salvaguarda"
                name={field("saveAbility")}
                value={action.saveAbility}
                options={ABILITIES.map(
                  (ability) => [ability, ABILITY_LABEL[ability].name] as const,
                )}
                onChange={(saveAbility) => onChange({ ...action, saveAbility })}
              />
              <SelectField
                label="CD"
                name={field("dcMode")}
                value={action.dcMode}
                options={[
                  ["spell", "CD de magia"],
                  ["expression", "Expressão"],
                ]}
                onChange={(dcMode) => onChange({ ...action, dcMode })}
              />
              {action.dcMode === "spell" ? (
                <NumberField
                  label="Ajuste da CD"
                  name={field("dcAdjust")}
                  inputMode="numeric"
                  value={action.dcAdjust}
                  parse={(text) => parseInteger(text, dcAdjustSchema)}
                  onCommit={(dcAdjust) => onChange({ ...action, dcAdjust })}
                />
              ) : (
                <ExpressionField
                  label="Expressão da CD"
                  name={field("dcExpression")}
                  value={action.dcExpression}
                  placeholder="ex.: 8 + con.mod + pb"
                  variables={variables}
                  scope={scope}
                  onCommit={(dcExpression) =>
                    onChange({ ...action, dcExpression })
                  }
                />
              )}
              <SelectField
                label="No sucesso"
                name={field("onSuccess")}
                value={action.onSuccess}
                options={entries(SAVE_OUTCOME_LABEL, SAVE_OUTCOMES)}
                onChange={(onSuccess) => onChange({ ...action, onSuccess })}
              />
            </div>
          )}

          <Check
            label="Ataques aumentam nos níveis 5, 11 e 17 (ex.: Rajada Mística)"
            checked={action.scaleAttacks}
            onChange={(scaleAttacks) => onChange({ ...action, scaleAttacks })}
          />

          <div className="flex items-center justify-between gap-2">
            <h5 className="text-sm font-semibold">Dano e cura</h5>
            <Button
              type="button"
              variant="secondary"
              className="py-1"
              disabled={action.parts.length >= MAX_PARTS_PER_ACTION}
              onClick={() =>
                onChange({
                  ...action,
                  parts: [...action.parts, createPart(crypto.randomUUID())],
                })
              }
            >
              Adicionar parte
            </Button>
          </div>
          <ul className="flex flex-col gap-2">
            {action.parts.map((part, partIndex) => (
              <PartRow
                key={part.id}
                part={part}
                index={partIndex}
                field={(name) => field(`part-${part.id}-${name}`)}
                isAttack={isAttack}
                upcastApplies={upcastApplies}
                canRemove={action.parts.length > 1}
                variables={variables}
                scope={scope}
                onChange={replacePart}
                onRemove={() =>
                  onChange({
                    ...action,
                    parts: action.parts.filter((p) => p.id !== part.id),
                  })
                }
              />
            ))}
          </ul>
          <SchemaTextField
            label="Descrição"
            name={field("description")}
            value={action.description}
            schema={actionDescriptionSchema}
            multiline
            hint="O que os valores não mostram: efeitos extras no acerto, propriedades da arma, alvos."
            onCommit={(description) => onChange({ ...action, description })}
          />
        </>
      )}
    </li>
  );
}

/**
 * Ações de uma fonte ou de um companheiro, até 6 (spec sheet-attacks, design
 * G8 e H7).
 */
export function ActionsEditor({
  ownerId,
  actions,
  newAction,
  upcastApplies,
  variables,
  scope = "sheet",
  hint,
  onChange,
}: {
  /** Id da fonte ou do companheiro, para os ids dos campos. */
  ownerId: string;
  actions: Action[];
  newAction: (id: string) => Action;
  /** Mostra "Dados por círculo" (magias de círculo 1 ou acima). */
  upcastApplies: boolean;
  variables: ExpressionVariables;
  scope?: ExpressionScope;
  hint: string;
  onChange: (actions: Action[]) => void;
}) {
  // Ações novas abrem; as existentes começam recolhidas.
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(new Set());
  const toggle = (id: string) =>
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  function move(index: number, offset: -1 | 1) {
    const next = [...actions];
    const [moved] = next.splice(index, 1);
    if (!moved) return;
    next.splice(index + offset, 0, moved);
    onChange(next);
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">Ações</h4>
        <Button
          type="button"
          variant="secondary"
          disabled={actions.length >= MAX_ACTIONS_PER_SOURCE}
          onClick={() => {
            const action = newAction(crypto.randomUUID());
            setOpenIds((current) => new Set(current).add(action.id));
            onChange([...actions, action]);
          }}
        >
          Adicionar ação
        </Button>
      </div>
      <p className="text-xs text-muted">{hint}</p>
      {actions.length === 0 ? (
        <p className="text-sm text-muted">Sem ações.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {actions.map((action, index) => (
            <ActionRow
              key={action.id}
              action={action}
              index={index}
              total={actions.length}
              ownerId={ownerId}
              upcastApplies={upcastApplies}
              open={openIds.has(action.id)}
              variables={variables}
              scope={scope}
              onToggle={() => toggle(action.id)}
              onChange={(next) =>
                onChange(actions.map((a) => (a.id === action.id ? next : a)))
              }
              onMove={(offset) => move(index, offset)}
              onRemove={() =>
                onChange(actions.filter((a) => a.id !== action.id))
              }
            />
          ))}
        </ul>
      )}
    </section>
  );
}
