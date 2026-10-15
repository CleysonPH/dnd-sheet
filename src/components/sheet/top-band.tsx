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

const formatMeters = (meters: number) => `${formatDecimal(meters)} m`;

/** CA, iniciativa, deslocamento, percepção passiva e PB (design V5/E6). */
export function CombatStats({ document, stats, update }: SheetPartProps) {
  const mode = useSheetMode();
  return (
    <Card title="Combate" style={{ gridArea: "stats" }}>
      <div className="grid grid-cols-3 gap-2">
        <Tile label="CA" icon={<ShieldIcon className="size-3.5" />}>
          <DerivedValue
            valueKey="armorClass"
            derived={stats.values.armorClass}
          />
        </Tile>
        <Tile label="Iniciativa" icon={<BoltIcon className="size-3.5" />}>
          <DerivedValue
            valueKey="initiative"
            derived={stats.values.initiative}
            signed
          />
        </Tile>
        <Tile
          label={mode !== "edit" ? "Desloc." : undefined}
          icon={<BootIcon className="size-3.5" />}
        >
          {mode !== "edit" ? (
            <DerivedValue
              valueKey="speed"
              derived={stats.values.speed}
              format={formatMeters}
            />
          ) : (
            // Em Editar, o campo é a base; o efetivo (com efeitos) vai abaixo.
            <span className="flex flex-col items-center gap-1 text-base">
              <NumberField
                label="Deslocamento (m)"
                name="speed"
                inputMode="decimal"
                value={document.speed}
                format={formatDecimal}
                parse={(text) => parseDecimal(text, speedSchema)}
                onCommit={(speed) => update({ speed })}
              />
              <span className="text-xs text-muted">
                efetivo{" "}
                <DerivedValue
                  valueKey="speed"
                  derived={stats.values.speed}
                  format={formatMeters}
                />
              </span>
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
        {/* Só com atributo de conjuração (design K5). */}
        {document.spellcastingAbility !== "none" && (
          <>
            <Tile label="CD de magia">
              <DerivedValue
                valueKey="spellSaveDc"
                derived={stats.values.spellSaveDc}
              />
            </Tile>
            <Tile label="Ataque mágico">
              <DerivedValue
                valueKey="spellAttack"
                derived={stats.values.spellAttack}
                signed
                align="right"
              />
            </Tile>
          </>
        )}
      </div>
    </Card>
  );
}
