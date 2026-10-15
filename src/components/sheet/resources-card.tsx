"use client";

import { useState } from "react";

import { Badge, Button, Card } from "@/components/form";
import { longRest, shortRest } from "@/engine/resources/rest";
import { deriveStats } from "@/engine/stats/derive";
import {
  pactSlotsSchema,
  slotCountSchema,
  type SpellSlot,
} from "@/engine/resources/schema";
import {
  currentOf,
  recover,
  resolveTrackers,
  spend,
} from "@/engine/resources/trackers";

import { NumberField } from "./number-field";
import { parseInteger } from "./parse";
import type { SheetPartProps } from "./props";
import { useSheetMode } from "./sheet-mode";
import { describeRecharge } from "./sources/trackers-editor";

/** − atual / máximo +, com os limites de 0 e do máximo (design R3). */
function Counter({
  label,
  used,
  max,
  onChange,
}: {
  label: string;
  used: number;
  max: number;
  onChange: (used: number) => void;
}) {
  const current = currentOf(max, used);
  return (
    <span className="flex shrink-0 items-center rounded-md border border-line text-sm">
      <button
        type="button"
        aria-label={`Gastar ${label}`}
        disabled={current === 0}
        onClick={() => onChange(spend(used, max))}
        className="px-2 py-1 text-muted hover:text-text disabled:opacity-40"
      >
        −
      </button>
      <span
        className="min-w-12 text-center font-semibold tabular-nums"
        aria-label={`${label}: ${current} de ${max}`}
      >
        {current} / {max}
      </span>
      <button
        type="button"
        aria-label={`Recuperar ${label}`}
        disabled={current >= max}
        onClick={() => onChange(recover(used, max))}
        className="px-2 py-1 text-muted hover:text-text disabled:opacity-40"
      >
        +
      </button>
    </span>
  );
}

const REST_SUMMARY = {
  short:
    "Aplica a regra de descanso curto de cada tracker e recupera a Magia de Pacto.",
  long: "Aplica a regra de descanso longo de cada tracker, recupera os espaços de magia, PV ao máximo, sem PV temporário, todos os dados de vida e testes contra a morte zerados.",
} as const;

/** Trackers, espaços de magia e descansos, abaixo da faixa de topo. */
export function ResourcesCard({ document, stats, update }: SheetPartProps) {
  const mode = useSheetMode();
  const [confirming, setConfirming] = useState<"short" | "long" | null>(null);
  const trackers = resolveTrackers(document, stats.variables);
  const { spellSlots, pactSlots } = document;

  function setTrackerUsed(sourceId: string, trackerId: string, used: number) {
    update((current) => ({
      ...current,
      sources: current.sources.map((source) =>
        source.id !== sourceId
          ? source
          : {
              ...source,
              trackers: source.trackers.map((tracker) =>
                tracker.id === trackerId ? { ...tracker, used } : tracker,
              ),
            },
      ),
    }));
  }

  function setSlot(index: number, patch: Partial<SpellSlot>) {
    update({
      spellSlots: spellSlots.map((slot, i) =>
        i === index ? { ...slot, ...patch } : slot,
      ),
    });
  }

  const visibleSlots = spellSlots
    .map((slot, index) => ({ slot, level: index + 1 }))
    .filter(({ slot }) => mode === "edit" || slot.max > 0);
  const showPact = mode === "edit" || pactSlots.max > 0;

  return (
    <Card
      title="Recursos"
      actions={
        confirming === null && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirming("short")}
            >
              Descanso curto
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirming("long")}
            >
              Descanso longo
            </Button>
          </div>
        )
      }
    >
      {confirming && (
        <div
          role="group"
          aria-label={`Confirmar descanso ${confirming === "short" ? "curto" : "longo"}`}
          className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-accent/40 bg-accent-soft p-3 text-sm"
        >
          <p className="min-w-0 flex-1">{REST_SUMMARY[confirming]}</p>
          <Button
            type="button"
            onClick={() => {
              // As variáveis vêm do documento atual, que o update entrega.
              const rest = confirming === "short" ? shortRest : longRest;
              update((current) =>
                rest(current, deriveStats(current).variables),
              );
              setConfirming(null);
            }}
          >
            Confirmar descanso {confirming === "short" ? "curto" : "longo"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setConfirming(null)}
          >
            Cancelar
          </Button>
        </div>
      )}

      {trackers.length === 0 && visibleSlots.length === 0 && !showPact ? (
        <p className="text-sm text-muted">
          Sem trackers nem espaços de magia. Acrescente trackers às fontes no
          modo Editar.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {trackers.length > 0 && (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {trackers.map((resolved) => {
                const label = `${resolved.tracker.name} (${resolved.sourceName})`;
                return (
                  <li
                    key={`${resolved.sourceId}-${resolved.tracker.id}`}
                    className="flex min-w-0 items-center gap-3 rounded-lg bg-surface-2 px-3 py-2"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {label}
                      </span>
                      <span className="block text-xs text-muted">
                        {describeRecharge(resolved.tracker)}
                      </span>
                    </span>
                    {resolved.error && (
                      <span title={resolved.error}>
                        <Badge tone="danger">{resolved.error}</Badge>
                      </span>
                    )}
                    <Counter
                      label={label}
                      used={resolved.tracker.used}
                      max={resolved.max}
                      onChange={(used) =>
                        setTrackerUsed(
                          resolved.sourceId,
                          resolved.tracker.id,
                          used,
                        )
                      }
                    />
                  </li>
                );
              })}
            </ul>
          )}

          {visibleSlots.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
                Espaços de magia
              </h3>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                {visibleSlots.map(({ slot, level }) => (
                  <li
                    key={level}
                    className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg bg-surface-2 px-3 py-2"
                  >
                    <span className="w-8 text-sm font-medium">{level}º</span>
                    {mode === "edit" && (
                      <span className="w-16">
                        <NumberField
                          label={`Máximo ${level}º`}
                          name={`slot-${level}-max`}
                          inputMode="numeric"
                          value={slot.max}
                          parse={(text) => parseInteger(text, slotCountSchema)}
                          onCommit={(max) => setSlot(level - 1, { max })}
                        />
                      </span>
                    )}
                    <Counter
                      label={`espaço de ${level}º círculo`}
                      used={slot.used}
                      max={slot.max}
                      onChange={(used) => setSlot(level - 1, { used })}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {showPact && (
            <section className="flex flex-wrap items-center gap-3 rounded-lg bg-surface-2 px-3 py-2">
              <span className="text-sm font-medium">
                Magia de Pacto ({pactSlots.level}º círculo)
              </span>
              {mode === "edit" && (
                <>
                  <span className="w-20">
                    <NumberField
                      label="Círculo"
                      name="pact-level"
                      inputMode="numeric"
                      value={pactSlots.level}
                      parse={(text) =>
                        parseInteger(text, pactSlotsSchema.shape.level)
                      }
                      onCommit={(level) =>
                        update({ pactSlots: { ...pactSlots, level } })
                      }
                    />
                  </span>
                  <span className="w-20">
                    <NumberField
                      label="Máximo"
                      name="pact-max"
                      inputMode="numeric"
                      value={pactSlots.max}
                      parse={(text) => parseInteger(text, slotCountSchema)}
                      onCommit={(max) =>
                        update({ pactSlots: { ...pactSlots, max } })
                      }
                    />
                  </span>
                </>
              )}
              <Counter
                label="espaço de Magia de Pacto"
                used={pactSlots.used}
                max={pactSlots.max}
                onChange={(used) =>
                  update({ pactSlots: { ...pactSlots, used } })
                }
              />
            </section>
          )}
        </div>
      )}
    </Card>
  );
}
