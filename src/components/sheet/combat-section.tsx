"use client";

import type { ReactNode } from "react";
import { z } from "zod";

import { Button } from "@/components/form";
import {
  hitPointsSchema,
  speedSchema,
  type SheetDocument,
} from "@/engine/sheet/document";
import { HIT_DICE, type HitDie } from "@/engine/stats/keys";

import { DerivedValue } from "./derived-value";
import { NumberField } from "./number-field";
import { formatDecimal, parseDecimal, parseInteger } from "./parse";
import { Section, type SectionProps } from "./section";

/** O PV atual vai de 0 ao máximo vigente, que o schema não conhece (design S3). */
function currentHitPointsSchema(max: number) {
  const message = `O PV atual vai de 0 a ${max}`;
  return z.number(message).int(message).min(0, message).max(max, message);
}

/** Marcar a caixa `index` leva o total a `index + 1`; desmarcar, a `index`. */
function toggleCount(count: number, index: number) {
  return count > index ? index : index + 1;
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-md border border-zinc-200 p-2 text-center dark:border-zinc-800">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-xl">{children}</span>
    </div>
  );
}

/** PV, dados de vida, testes contra a morte e os valores de combate. */
export function CombatSection({ document, stats, update }: SectionProps) {
  const { hitPoints, deathSaves } = document;
  const hitPointsMax = stats.values.hitPointsMax.value;
  const hitDiceMax = stats.values.hitDiceMax.value;
  // Gastos acima do total (ex.: o nível baixou) contam como o total.
  const spent = Math.min(hitPoints.hitDiceSpent, hitDiceMax);

  function setHitPoints(patch: Partial<SheetDocument["hitPoints"]>) {
    update({ hitPoints: { ...hitPoints, ...patch } });
  }

  function setDeathSaves(patch: Partial<SheetDocument["deathSaves"]>) {
    update({ deathSaves: { ...deathSaves, ...patch } });
  }

  return (
    <Section title="Combate" area="combat">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
          <NumberField
            label="PV atual"
            name="hp-current"
            inputMode="numeric"
            value={stats.hitPointsCurrent}
            parse={(text) =>
              parseInteger(text, currentHitPointsSchema(hitPointsMax))
            }
            onCommit={(current) =>
              setHitPoints({ damage: hitPointsMax - current })
            }
          />
          <div className="flex flex-col items-center pb-1.5">
            <span className="text-xs text-zinc-500">máximo</span>
            <DerivedValue
              valueKey="hitPointsMax"
              derived={stats.values.hitPointsMax}
              align="right"
              className="text-xl"
            />
          </div>
          <NumberField
            label="PV temporário"
            name="hp-temp"
            inputMode="numeric"
            value={hitPoints.temp}
            parse={(text) => parseInteger(text, hitPointsSchema.shape.temp)}
            onCommit={(temp) => setHitPoints({ temp })}
          />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="hit-die" className="text-sm font-medium">
              Dado de vida
            </label>
            <select
              id="hit-die"
              value={hitPoints.hitDie}
              onChange={(event) =>
                setHitPoints({ hitDie: Number(event.target.value) as HitDie })
              }
              className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
            >
              {HIT_DICE.map((die) => (
                <option key={die} value={die}>
                  d{die}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Dados de vida</span>
            <span className="flex items-baseline gap-1 py-1.5 text-lg">
              <span className="font-semibold tabular-nums">
                {stats.hitDiceAvailable}
              </span>
              /
              <DerivedValue
                valueKey="hitDiceMax"
                derived={stats.values.hitDiceMax}
              />
              <span className="text-sm">d{hitPoints.hitDie}</span>
            </span>
          </div>
          <div className="flex gap-2 pb-0.5">
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
        </div>

        <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <legend className="mb-1 font-medium">Testes contra a morte</legend>
          {(["successes", "failures"] as const).map((kind) => (
            <span key={kind} className="flex items-center gap-1">
              {kind === "successes" ? "Sucessos" : "Falhas"}
              {[0, 1, 2].map((index) => (
                <input
                  key={index}
                  type="checkbox"
                  className="size-4"
                  aria-label={`${kind === "successes" ? "Sucesso" : "Falha"} ${index + 1}`}
                  checked={deathSaves[kind] > index}
                  onChange={() =>
                    setDeathSaves({
                      [kind]: toggleCount(deathSaves[kind], index),
                    })
                  }
                />
              ))}
            </span>
          ))}
          <Button
            type="button"
            variant="secondary"
            disabled={deathSaves.successes === 0 && deathSaves.failures === 0}
            onClick={() => setDeathSaves({ successes: 0, failures: 0 })}
          >
            Limpar
          </Button>
        </fieldset>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
          <Stat label="Bônus de proficiência">
            <DerivedValue
              valueKey="proficiencyBonus"
              derived={stats.values.proficiencyBonus}
              signed
            />
          </Stat>
          <Stat label="Iniciativa">
            <DerivedValue
              valueKey="initiative"
              derived={stats.values.initiative}
              signed
              align="right"
            />
          </Stat>
          <Stat label="Percepção passiva">
            <DerivedValue
              valueKey="passivePerception"
              derived={stats.values.passivePerception}
            />
          </Stat>
          <div className="flex items-end">
            <NumberField
              label="Deslocamento (m)"
              name="speed"
              inputMode="decimal"
              value={document.speed}
              format={formatDecimal}
              parse={(text) => parseDecimal(text, speedSchema)}
              onCommit={(speed) => update({ speed })}
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
