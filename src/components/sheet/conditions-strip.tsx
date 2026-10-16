"use client";

import { useState } from "react";

import {
  ACTIVE_CONDITIONS,
  MAX_EXHAUSTION,
  type ActiveCondition,
} from "@/engine/traits/keys";

import { CONDITION_SUMMARY, EXHAUSTION_SUMMARY } from "./conditions";
import { CONDITION_LABEL } from "./labels";
import type { SheetPartProps } from "./props";
import { useCanAct } from "./sheet-mode";

const CHIP =
  "inline-flex items-center rounded-full border border-line bg-surface-2 text-sm";

/**
 * Condições ativas e Exaustão, logo abaixo da faixa de topo (design T6/T7).
 * Valem em Jogar e em Editar; na ficha compartilhada, só o que está marcado.
 */
export function ConditionsStrip({ document, update }: SheetPartProps) {
  const acts = useCanAct();
  const [open, setOpen] = useState<ActiveCondition | "exhaustion" | null>(null);
  const { conditions, exhaustion } = document;
  const missing = ACTIVE_CONDITIONS.filter(
    (condition) => !conditions.includes(condition),
  );

  if (!acts && conditions.length === 0 && exhaustion === 0) return null;

  function toggle(key: ActiveCondition | "exhaustion") {
    setOpen((current) => (current === key ? null : key));
  }

  function remove(condition: ActiveCondition) {
    update((current) => ({
      ...current,
      conditions: current.conditions.filter((c) => c !== condition),
    }));
    setOpen(null);
  }

  function add(condition: ActiveCondition) {
    update((current) => ({
      ...current,
      // Mantém a ordem da lista do 5.5e.
      conditions: ACTIVE_CONDITIONS.filter(
        (c) => c === condition || current.conditions.includes(c),
      ),
    }));
  }

  const summary =
    open === "exhaustion"
      ? EXHAUSTION_SUMMARY
      : open
        ? CONDITION_SUMMARY[open]
        : null;

  return (
    <section
      aria-label="Condições"
      className="flex flex-col gap-2 rounded-xl border border-line bg-surface px-4 py-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-1 text-xs font-semibold tracking-wider text-muted uppercase">
          Condições
        </h2>
        {conditions.map((condition) => (
          <span key={condition} className={CHIP}>
            <button
              type="button"
              aria-expanded={open === condition}
              title={CONDITION_SUMMARY[condition]}
              onClick={() => toggle(condition)}
              className={`rounded-full py-0.5 pl-3 font-medium ${acts ? "pr-1" : "pr-3"}`}
            >
              {CONDITION_LABEL[condition]}
            </button>
            {acts && (
              <button
                type="button"
                aria-label={`Remover ${CONDITION_LABEL[condition]}`}
                onClick={() => remove(condition)}
                className="rounded-full px-2 py-0.5 text-muted hover:text-text"
              >
                ×
              </button>
            )}
          </span>
        ))}
        {acts && missing.length > 0 && (
          <select
            aria-label="Acrescentar condição"
            value=""
            onChange={(event) => {
              if (event.target.value) {
                add(event.target.value as ActiveCondition);
              }
            }}
            className="rounded-full border border-dashed border-line bg-surface px-3 py-0.5 text-sm text-muted"
          >
            <option value="">+ Condição</option>
            {missing.map((condition) => (
              <option key={condition} value={condition}>
                {CONDITION_LABEL[condition]}
              </option>
            ))}
          </select>
        )}
        {(acts || exhaustion > 0) && (
          <span
            className={`${CHIP} ml-auto ${exhaustion > 0 ? "border-danger/50 text-danger" : ""}`}
          >
            {acts && (
              <button
                type="button"
                aria-label="Descer a Exaustão"
                disabled={exhaustion === 0}
                onClick={() =>
                  update({ exhaustion: Math.max(0, exhaustion - 1) })
                }
                className="px-2 py-0.5 text-muted hover:text-text disabled:opacity-40"
              >
                −
              </button>
            )}
            <button
              type="button"
              aria-expanded={open === "exhaustion"}
              title={EXHAUSTION_SUMMARY}
              onClick={() => toggle("exhaustion")}
              className={`py-0.5 font-medium tabular-nums ${acts ? "" : "px-3"}`}
            >
              Exaustão {exhaustion}
            </button>
            {acts && (
              <button
                type="button"
                aria-label="Subir a Exaustão"
                disabled={exhaustion === MAX_EXHAUSTION}
                onClick={() =>
                  update({
                    exhaustion: Math.min(MAX_EXHAUSTION, exhaustion + 1),
                  })
                }
                className="px-2 py-0.5 text-muted hover:text-text disabled:opacity-40"
              >
                +
              </button>
            )}
          </span>
        )}
      </div>
      {summary && (
        <p className="text-sm text-muted" role="note">
          <strong className="text-text">
            {open === "exhaustion"
              ? "Exaustão"
              : CONDITION_LABEL[open as ActiveCondition]}
            :
          </strong>{" "}
          {summary}
        </p>
      )}
      {exhaustion === MAX_EXHAUSTION && (
        <p
          role="alert"
          className="rounded-md border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          Exaustão {MAX_EXHAUSTION}: {document.identity.name} morre por
          Exaustão.
        </p>
      )}
    </section>
  );
}
