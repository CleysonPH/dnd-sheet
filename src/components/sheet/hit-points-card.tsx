"use client";

import { useState } from "react";
import { z } from "zod";

import { Button, Card, TextField } from "@/components/form";
import { HeartIcon } from "@/components/icons";
import { hitPointsSchema } from "@/engine/sheet/document";
import {
  applyDamage,
  applyHealing,
  hitPointsAmountSchema,
} from "@/engine/stats/hit-points";

import { DerivedValue } from "./derived-value";
import { NumberField } from "./number-field";
import { parseInteger } from "./parse";
import type { SheetPartProps } from "./props";
import { useSheetMode } from "./sheet-mode";

/** O PV atual vai de 0 ao máximo vigente, que o schema não conhece (design S3). */
function currentHitPointsSchema(max: number) {
  const message = `O PV atual vai de 0 a ${max}`;
  return z.number(message).int(message).min(0, message).max(max, message);
}

/** PV atual, máximo e temporário, com dano e cura (design V3/V5). */
export function HitPointsCard({ document, stats, update }: SheetPartProps) {
  const mode = useSheetMode();
  const { hitPoints } = document;
  const max = stats.values.hitPointsMax.value;
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState<string>();

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
      </div>

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
    </Card>
  );
}
