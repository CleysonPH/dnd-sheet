"use client";

import { useState } from "react";
import { z } from "zod";

import { Button, Card, TextField } from "@/components/form";
import { HeartIcon } from "@/components/icons";
import { hitPointsSchema } from "@/engine/sheet/document";
import {
  concentratingSpell,
  concentrationSaveDc,
  endConcentration,
} from "@/engine/stats/concentration";
import {
  applyDamage,
  applyHealing,
  hitPointsAmountSchema,
} from "@/engine/stats/hit-points";

import { DerivedValue } from "./derived-value";
import { NumberField } from "./number-field";
import { formatSigned, parseInteger } from "./parse";
import type { SheetPartProps } from "./props";
import { useCanAct, useSheetMode } from "./sheet-mode";

/** O PV atual vai de 0 ao máximo vigente, que o schema não conhece (design S3). */
function currentHitPointsSchema(max: number) {
  const message = `O PV atual vai de 0 a ${max}`;
  return z.number(message).int(message).min(0, message).max(max, message);
}

const TOGGLE =
  "rounded-md border border-line px-2 py-1 text-xs font-medium text-muted transition-colors hover:text-text aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent-text";

/** Aviso depois do dano a quem está concentrado (design I4). Não é gravado. */
type ConcentrationNotice =
  | { kind: "save"; spell: string; dc: number }
  | { kind: "ended"; spell: string };

/** PV atual, máximo e temporário, com dano e cura (design V3/V5). */
export function HitPointsCard({ document, stats, update }: SheetPartProps) {
  const mode = useSheetMode();
  const acts = useCanAct();
  const { hitPoints } = document;
  const max = stats.values.hitPointsMax.value;
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState<string>();
  const [notice, setNotice] = useState<ConcentrationNotice | null>(null);
  const concentration = concentratingSpell(document.sources);
  const conSave = stats.values["save.con"].value;

  function apply(kind: "damage" | "healing") {
    const parsed = parseInteger(amount, hitPointsAmountSchema);
    if (!parsed.ok) {
      setAmountError(parsed.error);
      return;
    }
    const value = parsed.value;
    update((current) =>
      kind === "damage"
        ? applyDamage(current, value)
        : applyHealing(current, value),
    );
    setAmount("");
    if (kind === "damage" && concentration) {
      // A 0 PV, applyDamage já encerrou a concentração (design I3).
      const stillConcentrating = concentratingSpell(
        applyDamage(document, value).sources,
      );
      setNotice(
        stillConcentrating
          ? {
              kind: "save",
              spell: concentration.name,
              dc: concentrationSaveDc(value),
            }
          : { kind: "ended", spell: concentration.name },
      );
    }
  }

  function loseConcentration() {
    update((current) => endConcentration(current));
    setNotice(null);
  }

  return (
    <Card
      title={
        <span className="flex items-center gap-1.5">
          <HeartIcon className="size-4 text-danger" />
          Pontos de vida
        </span>
      }
      style={{ gridArea: "hp" }}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {concentration && (
            // Indicador destacado de concentração (design I5).
            <span
              role="status"
              className="inline-flex items-center gap-1.5 rounded-md bg-accent py-1 pr-1 pl-2 text-xs font-medium text-on-accent"
            >
              <span
                aria-hidden
                className="size-2 animate-pulse rounded-full bg-on-accent"
              />
              Concentrando em {concentration.name}
              {acts && (
                <button
                  type="button"
                  onClick={() => update((current) => endConcentration(current))}
                  aria-label={`Encerrar a concentração em ${concentration.name}`}
                  className="rounded px-1.5 py-0.5 hover:bg-white/20"
                >
                  Encerrar
                </button>
              )}
            </span>
          )}
          <button
            type="button"
            aria-pressed={document.heroicInspiration}
            disabled={!acts}
            onClick={() =>
              update({ heroicInspiration: !document.heroicInspiration })
            }
            className={TOGGLE}
          >
            Inspiração heroica
          </button>
        </div>
      }
    >
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <div className="flex items-end gap-2">
          {mode === "edit" ? (
            <div className="w-24">
              <NumberField
                label="PV atual"
                name="hp-current"
                inputMode="numeric"
                value={stats.hitPointsCurrent}
                parse={(text) =>
                  parseInteger(text, currentHitPointsSchema(max))
                }
                onCommit={(current) =>
                  update({ hitPoints: { ...hitPoints, damage: max - current } })
                }
              />
            </div>
          ) : (
            <span
              className="text-5xl leading-none font-semibold tabular-nums"
              aria-label={`PV atual: ${stats.hitPointsCurrent}`}
            >
              {stats.hitPointsCurrent}
            </span>
          )}
          <span className="pb-1 text-2xl text-muted">/</span>
          <span className="pb-1 text-2xl">
            <DerivedValue
              valueKey="hitPointsMax"
              derived={stats.values.hitPointsMax}
            />
          </span>
        </div>
        {acts ? (
          <div className="w-24">
            <NumberField
              label="Temporário"
              name="hp-temp"
              inputMode="numeric"
              value={hitPoints.temp}
              parse={(text) => parseInteger(text, hitPointsSchema.shape.temp)}
              onCommit={(temp) => update({ hitPoints: { ...hitPoints, temp } })}
            />
          </div>
        ) : (
          <p className="pb-1 text-sm text-muted">
            Temporário{" "}
            <strong className="text-text tabular-nums">{hitPoints.temp}</strong>
          </p>
        )}
      </div>

      {acts && (
        <div className="mt-4 flex items-start gap-2">
          <div className="w-24">
            <TextField
              label="Quantidade"
              name="hp-amount"
              inputMode="numeric"
              autoComplete="off"
              value={amount}
              error={amountError}
              onChange={(event) => {
                setAmount(event.target.value);
                setAmountError(undefined);
              }}
            />
          </div>
          <Button
            type="button"
            variant="danger"
            className="mt-6"
            onClick={() => apply("damage")}
          >
            Dano
          </Button>
          <Button
            type="button"
            variant="success"
            className="mt-6"
            onClick={() => apply("healing")}
          >
            Cura
          </Button>
        </div>
      )}

      {notice && (
        <div
          role="alert"
          className="mt-4 flex flex-col gap-2 rounded-md border border-accent/40 bg-accent-soft px-3 py-2 text-sm"
        >
          {notice.kind === "save" ? (
            <>
              <p>
                Teste de resistência de Constituição{" "}
                <strong>
                  CD {notice.dc} ({formatSigned(conSave)})
                </strong>{" "}
                para manter <strong>{notice.spell}</strong>.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setNotice(null)}
                >
                  Manteve
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={loseConcentration}
                >
                  Perdeu
                </Button>
              </div>
            </>
          ) : (
            <>
              <p>
                Com 0 PV, a concentração em <strong>{notice.spell}</strong>{" "}
                terminou.
              </p>
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setNotice(null)}
                >
                  Ok
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
