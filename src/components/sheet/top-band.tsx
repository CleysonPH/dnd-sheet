"use client";

import type { ReactNode } from "react";

import { Card } from "@/components/form";
import { BoltIcon, BootIcon, ShieldIcon } from "@/components/icons";
import { speedSchema } from "@/engine/sheet/document";

import { DerivedValue } from "./derived-value";
import { NumberField } from "./number-field";
import { formatDecimal, parseDecimal } from "./parse";
import type { SheetPartProps } from "./props";
import { useSheetMode } from "./sheet-mode";

function Tile({
  label,
  icon,
  children,
}: {
  /** Sem rótulo quando o conteúdo já é um campo com o próprio rótulo. */
  label?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg bg-surface-2 px-2 py-3 text-center">
      {label && (
        <span className="flex items-center gap-1 text-xs text-muted">
          {icon}
          {label}
        </span>
      )}
      <span className="text-2xl">{children}</span>
    </div>
  );
}

/** CA, iniciativa, deslocamento, percepção passiva e PB (design V5). */
export function CombatStats({ document, stats, update }: SheetPartProps) {
  const mode = useSheetMode();
  return (
    <Card title="Combate" style={{ gridArea: "stats" }}>
      <div className="grid grid-cols-3 gap-2">
        {/* A CA chega com sheet-effects; até lá o lugar fica reservado. */}
        <Tile label="CA" icon={<ShieldIcon className="size-3.5" />}>
          <span
            className="font-semibold text-muted"
            title="Ainda não calculada"
          >
            —
          </span>
        </Tile>
        <Tile label="Iniciativa" icon={<BoltIcon className="size-3.5" />}>
          <DerivedValue
            valueKey="initiative"
            derived={stats.values.initiative}
            signed
          />
        </Tile>
        <Tile
          label={mode === "play" ? "Desloc." : undefined}
          icon={<BootIcon className="size-3.5" />}
        >
          {mode === "play" ? (
            <span className="font-semibold tabular-nums">
              {formatDecimal(document.speed)}
              <span className="ml-0.5 text-sm text-muted">m</span>
            </span>
          ) : (
            <span className="block text-base">
              <NumberField
                label="Deslocamento (m)"
                name="speed"
                inputMode="decimal"
                value={document.speed}
                format={formatDecimal}
                parse={(text) => parseDecimal(text, speedSchema)}
                onCommit={(speed) => update({ speed })}
              />
            </span>
          )}
        </Tile>
        <Tile label="Perc. passiva">
          <DerivedValue
            valueKey="passivePerception"
            derived={stats.values.passivePerception}
          />
        </Tile>
        <Tile label="Proficiência">
          <DerivedValue
            valueKey="proficiencyBonus"
            derived={stats.values.proficiencyBonus}
            signed
            align="right"
          />
        </Tile>
      </div>
    </Card>
  );
}
