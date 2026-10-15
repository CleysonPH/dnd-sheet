"use client";

import { Button } from "@/components/form";
import type { ExpressionVariables } from "@/engine/effects/expression";
import {
  MAX_TRACKERS_PER_SOURCE,
  RECHARGE_MODES,
  createTracker,
  trackerNameSchema,
  type Recharge,
  type Tracker,
} from "@/engine/resources/schema";

import { ExpressionField } from "./expression-field";
import { SchemaTextField } from "./schema-text-field";

export const RECHARGE_MODE_LABEL: Record<Recharge["mode"], string> = {
  none: "Não recupera",
  all: "Recupera tudo",
  amount: "Recupera quantidade",
};

function ruleSummary(rule: Recharge): string {
  if (rule.mode === "none") return "não recupera";
  if (rule.mode === "all") return "tudo";
  return rule.amount;
}

/** "Curto: 1 · Longo: tudo" (design R4). */
export function describeRecharge(tracker: Tracker): string {
  return `Curto: ${ruleSummary(tracker.shortRest)} · Longo: ${ruleSummary(tracker.longRest)}`;
}

/** Regra de um descanso: modo e, se for quantidade, a expressão. */
function RechargeField({
  label,
  name,
  rule,
  variables,
  onChange,
}: {
  label: string;
  name: string;
  rule: Recharge;
  variables: ExpressionVariables;
  onChange: (rule: Recharge) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={`${name}-mode`} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={`${name}-mode`}
        value={rule.mode}
        onChange={(event) =>
          onChange({ ...rule, mode: event.target.value as Recharge["mode"] })
        }
        className="rounded-md border border-line bg-bg px-2 py-2 text-sm"
      >
        {RECHARGE_MODES.map((mode) => (
          <option key={mode} value={mode}>
            {RECHARGE_MODE_LABEL[mode]}
          </option>
        ))}
      </select>
      {rule.mode === "amount" && (
        <ExpressionField
          label="Quantidade"
          name={`${name}-amount`}
          value={rule.amount}
          placeholder="ex.: 1"
          variables={variables}
          onCommit={(amount) => onChange({ ...rule, amount })}
        />
      )}
    </div>
  );
}

/** Trackers de uma fonte, até 10 (design R4). O usado fica no cartão Recursos. */
export function TrackersEditor({
  sourceId,
  trackers,
  variables,
  onChange,
}: {
  sourceId: string;
  trackers: Tracker[];
  variables: ExpressionVariables;
  onChange: (trackers: Tracker[]) => void;
}) {
  const replace = (id: string, patch: Partial<Tracker>) =>
    onChange(trackers.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">Trackers</h4>
        <Button
          type="button"
          variant="secondary"
          disabled={trackers.length >= MAX_TRACKERS_PER_SOURCE}
          onClick={() =>
            onChange([...trackers, createTracker(crypto.randomUUID())])
          }
        >
          Adicionar tracker
        </Button>
      </div>
      {trackers.length === 0 ? (
        <p className="text-sm text-muted">Sem trackers.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {trackers.map((tracker, index) => {
            const field = (name: string) =>
              `tracker-${sourceId}-${tracker.id}-${name}`;
            return (
              <li
                key={tracker.id}
                className="flex flex-col gap-3 rounded-lg border border-line p-3"
              >
                <div className="grid items-start gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <div className="min-w-0">
                    <SchemaTextField
                      label="Nome"
                      name={field("name")}
                      value={tracker.name}
                      schema={trackerNameSchema}
                      onCommit={(name) => replace(tracker.id, { name })}
                    />
                  </div>
                  <ExpressionField
                    label="Máximo"
                    name={field("max")}
                    value={tracker.max}
                    placeholder="ex.: max(1, car.mod)"
                    variables={variables}
                    onCommit={(max) => replace(tracker.id, { max })}
                  />
                  <div className="sm:pt-6">
                    <Button
                      type="button"
                      variant="secondary"
                      aria-label={`Remover tracker ${index + 1}`}
                      onClick={() =>
                        onChange(trackers.filter((t) => t.id !== tracker.id))
                      }
                    >
                      Remover
                    </Button>
                  </div>
                </div>
                <div className="grid items-start gap-3 sm:grid-cols-2">
                  <RechargeField
                    label="Descanso curto"
                    name={field("short")}
                    rule={tracker.shortRest}
                    variables={variables}
                    onChange={(shortRest) => replace(tracker.id, { shortRest })}
                  />
                  <RechargeField
                    label="Descanso longo"
                    name={field("long")}
                    rule={tracker.longRest}
                    variables={variables}
                    onChange={(longRest) => replace(tracker.id, { longRest })}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
