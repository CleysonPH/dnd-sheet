"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { Button, FormMessage } from "@/components/form";
import type { SheetDocument } from "@/engine/sheet/document";
import { deriveStats } from "@/engine/stats/derive";
import type { DerivedKey } from "@/engine/stats/keys";

import { AbilitiesSection } from "./abilities-section";
import type { AutosaveStatus } from "./autosave";
import { CombatSection } from "./combat-section";
import { DeleteSheetPanel } from "./delete-sheet-panel";
import { OverrideProvider } from "./derived-value";
import { IdentitySection } from "./identity-section";
import { SkillsSection } from "./skills-section";
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
  // O motor roda no cliente a cada edição (design D3/S4).
  const stats = useMemo(() => deriveStats(document), [document]);

  function update(patch: Partial<SheetDocument>) {
    edit({ ...document, ...patch });
  }

  function setOverride(key: DerivedKey, value: number | undefined) {
    const overrides = { ...document.overrides };
    if (value === undefined) delete overrides[key];
    else overrides[key] = value;
    update({ overrides });
  }

  const section = { document, stats, update };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="min-w-0 truncate text-2xl font-semibold">
          {document.identity.name}
        </h1>
        <p
          role="status"
          aria-live="polite"
          className="shrink-0 text-sm text-zinc-500"
          data-status={status}
        >
          {STATUS_TEXT[status]}
        </p>
      </div>

      {status === "conflict" && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <FormMessage>
            Esta ficha foi alterada em outro lugar. Recarregue para ver a versão
            mais nova; o que você editou desde o último salvamento aqui não foi
            gravado.
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
        <fieldset disabled={locked} className="min-w-0 disabled:opacity-60">
          {/* Ordem do DOM = ordem no celular; colunas no desktop via CSS. */}
          <div className="sheet-grid">
            <IdentitySection {...section} />
            <CombatSection {...section} />
            <AbilitiesSection {...section} />
            <SkillsSection {...section} />
          </div>
        </fieldset>
      </OverrideProvider>

      {/* Em conflito ou já excluída, excluir daqui não faz sentido. */}
      {!locked && (
        <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          {/* Usa o nome atual, já que a pessoa pode ter renomeado o personagem. */}
          <DeleteSheetPanel id={id} name={document.identity.name} />
        </div>
      )}
    </div>
  );
}
