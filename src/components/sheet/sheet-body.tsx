"use client";

import { ABILITIES } from "@/engine/stats/keys";

import { AbilityBlock } from "./ability-block";
import { HitDiceCard } from "./hit-dice-card";
import { HitPointsCard } from "./hit-points-card";
import { IdentitySection } from "./identity-section";
import type { SheetPartProps } from "./props";
import { ResourcesCard } from "./resources-card";
import { useSheetMode } from "./sheet-mode";
import { SourcesPanel } from "./sources/sources-panel";
import { CombatStats } from "./top-band";

/**
 * Corpo da ficha, comum ao editor do dono e à ficha compartilhada (design
 * L4). Cada parte decide pelo modo o que mostrar.
 */
export function SheetBody(part: SheetPartProps) {
  const mode = useSheetMode();
  return (
    <>
      {mode === "edit" && <IdentitySection {...part} />}
      {/* Ordem do DOM = ordem no celular; colunas no desktop via CSS. */}
      <div className="sheet-top">
        <HitPointsCard {...part} />
        <CombatStats {...part} />
        <HitDiceCard {...part} />
      </div>
      {/* DOM: Recursos antes dos atributos (ordem do celular). A partir de
          lg, atributos 2x3 à esquerda e Recursos à direita (design R3). */}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 lg:col-start-2 lg:row-start-1">
          <ResourcesCard {...part} />
        </div>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:col-start-1 lg:row-start-1">
          {ABILITIES.map((ability) => (
            <AbilityBlock key={ability} ability={ability} {...part} />
          ))}
        </div>
      </div>
      <SourcesPanel {...part} />
    </>
  );
}
