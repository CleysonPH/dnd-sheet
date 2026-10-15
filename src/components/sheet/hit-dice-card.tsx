"use client";

import { Button, Card } from "@/components/form";
import { DiceIcon } from "@/components/icons";
import type { SheetDocument } from "@/engine/sheet/document";
import { HIT_DICE, type HitDie } from "@/engine/stats/keys";

import { DerivedValue } from "./derived-value";
import type { SheetPartProps } from "./props";
import { useCanAct, useSheetMode } from "./sheet-mode";

/** Marcar a caixa `index` leva o total a `index + 1`; desmarcar, a `index`. */
function toggleCount(count: number, index: number) {
  return count > index ? index : index + 1;
}

/** Dados de vida e, só com 0 PV, os testes contra a morte (design V5). */
export function HitDiceCard({ document, stats, update }: SheetPartProps) {
  const mode = useSheetMode();
  const acts = useCanAct();
  const { hitPoints, deathSaves } = document;
  const hitDiceMax = stats.values.hitDiceMax.value;
  // Gastos acima do total (ex.: o nível baixou) contam como o total.
  const spent = Math.min(hitPoints.hitDiceSpent, hitDiceMax);
  const dying = stats.hitPointsCurrent === 0;

  function setHitPoints(patch: Partial<SheetDocument["hitPoints"]>) {
    update({ hitPoints: { ...hitPoints, ...patch } });
  }

  return (
    <Card
      title={
        <span className="flex items-center gap-1.5">
          <DiceIcon className="size-4 text-accent-text" />
          Dados de vida
        </span>
      }
      style={{ gridArea: "dice" }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="flex items-baseline gap-1 text-3xl"
          aria-label={`Dados de vida: ${stats.hitDiceAvailable} de ${hitDiceMax}`}
        >
          <span className="font-semibold tabular-nums">
            {stats.hitDiceAvailable}
          </span>
          <span className="text-muted">/</span>
          <DerivedValue
            valueKey="hitDiceMax"
            derived={stats.values.hitDiceMax}
          />
          {mode !== "edit" && (
            <span className="text-base text-muted">d{hitPoints.hitDie}</span>
          )}
        </span>
        {mode === "edit" && (
          <span className="flex items-center gap-2 text-sm">
            <label htmlFor="hit-die" className="font-medium">
              Dado
            </label>
            <select
              id="hit-die"
              value={hitPoints.hitDie}
              onChange={(event) =>
                setHitPoints({ hitDie: Number(event.target.value) as HitDie })
              }
              className="rounded-md border border-line bg-bg px-2 py-1.5 text-sm"
            >
              {HIT_DICE.map((die) => (
                <option key={die} value={die}>
                  d{die}
                </option>
              ))}
            </select>
          </span>
        )}
      </div>
      {acts && (
        <div className="mt-3 flex gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={stats.hitDiceAvailable === 0}
            onClick={() => setHitPoints({ hitDiceSpent: spent + 1 })}
          >
            Gastar
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={spent === 0}
            onClick={() => setHitPoints({ hitDiceSpent: spent - 1 })}
          >
            Recuperar
          </Button>
        </div>
      )}

      {/* Só com 0 PV; ao sair de 0 eles são zerados (design V3). */}
      {dying && (
        <fieldset className="mt-4 rounded-lg border border-danger/40 bg-danger-soft p-3 text-sm">
          <legend className="px-1 font-medium text-danger">
            Testes contra a morte
          </legend>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {(["successes", "failures"] as const).map((kind) => (
              <span key={kind} className="flex items-center gap-1.5">
                {kind === "successes" ? "Sucessos" : "Falhas"}
                {[0, 1, 2].map((index) => (
                  <input
                    key={index}
                    type="checkbox"
                    className="size-4 accent-accent"
                    aria-label={`${kind === "successes" ? "Sucesso" : "Falha"} ${index + 1}`}
                    checked={deathSaves[kind] > index}
                    disabled={!acts}
                    onChange={() =>
                      update({
                        deathSaves: {
                          ...deathSaves,
                          [kind]: toggleCount(deathSaves[kind], index),
                        },
                      })
                    }
                  />
                ))}
              </span>
            ))}
            {acts && (
              <Button
                type="button"
                variant="secondary"
                disabled={
                  deathSaves.successes === 0 && deathSaves.failures === 0
                }
                onClick={() =>
                  update({ deathSaves: { successes: 0, failures: 0 } })
                }
              >
                Limpar
              </Button>
            )}
          </div>
        </fieldset>
      )}
    </Card>
  );
}
