"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button, FormMessage } from "@/components/form";
import type { SheetDocument } from "@/engine/sheet/document";
import { deriveStats } from "@/engine/stats/derive";
import { normalizeDeathSaves } from "@/engine/stats/hit-points";
import { ABILITIES, type DerivedKey } from "@/engine/stats/keys";

import { AbilityBlock } from "./ability-block";
import type { AutosaveStatus } from "./autosave";
import { DeleteSheetPanel } from "./delete-sheet-panel";
import { OverrideProvider } from "./derived-value";
import { HitDiceCard } from "./hit-dice-card";
import { HitPointsCard } from "./hit-points-card";
import { IdentitySection } from "./identity-section";
import { initialSheetMode, type SheetMode } from "./mode";
import type { SheetChange } from "./props";
import { ModeSwitch, SheetModeProvider } from "./sheet-mode";
import { SourcesPanel } from "./sources/sources-panel";
import { CombatStats } from "./top-band";
import { useSheetAutosave, type SaveOutcome } from "./use-sheet-autosave";

const STATUS_TEXT: Record<AutosaveStatus, string> = {
  saved: "Salvo",
  pending: "Salvando…",
  saving: "Salvando…",
  error: "Não salvo. Tentando de novo…",
  invalid: "Não salvo: dados inválidos",
  conflict: "Não salvo",
  deleted: "Não salvo",
};

/** "Anão · Bárbaro 5 · Soldado", sem as partes vazias. */
function subtitle({ identity }: SheetDocument): string {
  const classLevel = identity.class
    ? `${identity.class} ${identity.level}`
    : `Nível ${identity.level}`;
  return [identity.species, classLevel, identity.background]
    .filter(Boolean)
    .join(" · ");
}

export function SheetEditor({
  id,
  initialDocument,
  initialVersion,
  save,
}: {
  id: string;
  initialDocument: SheetDocument;
  initialVersion: number;
  save: (baseVersion: number, document: SheetDocument) => Promise<SaveOutcome>;
}) {
  const router = useRouter();
  const { document, status, locked, edit } = useSheetAutosave({
    initialDocument,
    initialVersion,
    save,
  });
  // Estado só da tela: trocar de modo não passa pelo autosave (design V4).
  const [mode, setMode] = useState<SheetMode>(() =>
    initialSheetMode(initialDocument),
  );
  // O motor roda no cliente a cada edição (design D3/S4).
  const stats = useMemo(() => deriveStats(document), [document]);

  function update(change: SheetChange) {
    const next =
      typeof change === "function"
        ? change(document)
        : { ...document, ...change };
    // Com PV acima de 0, os testes contra a morte ficam zerados (design V3).
    edit(normalizeDeathSaves(next));
  }

  function setOverride(key: DerivedKey, value: number | undefined) {
    const overrides = { ...document.overrides };
    if (value === undefined) delete overrides[key];
    else overrides[key] = value;
    update({ overrides });
  }

  const part = { document, stats, update };

  return (
    <SheetModeProvider value={mode}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-3xl font-semibold">
              {document.identity.name}
            </h1>
            <p className="text-sm text-muted">{subtitle(document)}</p>
          </div>
          <p
            role="status"
            aria-live="polite"
            className="text-sm text-muted"
            data-status={status}
          >
            {STATUS_TEXT[status]}
          </p>
          <ModeSwitch mode={mode} onChange={setMode} />
        </div>

        {status === "conflict" && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <FormMessage>
              Esta ficha foi alterada em outro lugar. Recarregue para ver a
              versão mais nova; o que você editou desde o último salvamento aqui
              não foi gravado.
            </FormMessage>
            <Button type="button" onClick={() => router.refresh()}>
              Recarregar
            </Button>
          </div>
        )}
        {status === "deleted" && (
          <FormMessage>
            Esta ficha não existe mais: ela foi excluída em outro lugar.
          </FormMessage>
        )}

        <OverrideProvider setOverride={setOverride}>
          <fieldset
            disabled={locked}
            className="flex min-w-0 flex-col gap-4 disabled:opacity-60"
          >
            {mode === "edit" && <IdentitySection {...part} />}
            {/* Ordem do DOM = ordem no celular; colunas no desktop via CSS. */}
            <div className="sheet-top">
              <HitPointsCard {...part} />
              <CombatStats {...part} />
              <HitDiceCard {...part} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ABILITIES.map((ability) => (
                <AbilityBlock key={ability} ability={ability} {...part} />
              ))}
            </div>
            <SourcesPanel {...part} />
          </fieldset>
        </OverrideProvider>

        {/* Em conflito ou já excluída, excluir daqui não faz sentido. */}
        {mode === "edit" && !locked && (
          <div className="mt-6 border-t border-line pt-6">
            {/* Usa o nome atual, já que a pessoa pode ter renomeado o personagem. */}
            <DeleteSheetPanel id={id} name={document.identity.name} />
          </div>
        )}
      </div>
    </SheetModeProvider>
  );
}
