"use client";

import { useMemo, useState } from "react";

import { Button, Card } from "@/components/form";
import { deriveAttackList, type ActionLine } from "@/engine/attacks/derive";

import { Contributions, PanelShell } from "../derived-value";
import { formatSigned } from "../parse";
import type { SheetPartProps } from "../props";
import { useSheetMode } from "../sheet-mode";
import { RANGE_LABEL, formatCheck, formatDamage, lineName } from "./labels";

/** Acerto ou CD com o painel de origem, sem valor manual (design G8). */
export function CheckValue({
  line,
  open,
  onToggle,
}: {
  line: ActionLine;
  open: boolean;
  onToggle: () => void;
}) {
  const resolved = line.toHit ?? line.dc;
  const text = formatCheck(line);
  if (!resolved) return null;
  const panelId = `attack-origin-${line.sourceId}-${line.actionId}`;
  const label = line.toHit ? "Acerto" : "CD";
  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`${label} de ${lineName(line)}: ${text}. Ver origem`}
        onClick={onToggle}
        className="rounded px-1 font-semibold whitespace-nowrap tabular-nums hover:bg-surface-2"
      >
        {text}
      </button>
      {open && (
        <PanelShell
          id={panelId}
          ariaLabel={`Origem: ${label} de ${lineName(line)}`}
          align="right"
          onClose={onToggle}
        >
          <p className="font-medium">
            {label}: {text}
          </p>
          <Contributions
            parts={resolved.parts}
            format={line.toHit ? formatSigned : String}
          />
          <Button
            type="button"
            variant="secondary"
            autoFocus
            onClick={onToggle}
          >
            Fechar
          </Button>
        </PanelShell>
      )}
    </span>
  );
}

/**
 * Cartão Ataques (spec sheet-attacks): as ações dos itens equipados, dos
 * talentos e traços e das magias preparadas, já calculadas. Só exibe.
 */
export function AttacksCard({ document, stats }: SheetPartProps) {
  const mode = useSheetMode();
  const lines = useMemo(
    () => deriveAttackList(document, stats),
    [document, stats],
  );
  const [openKey, setOpenKey] = useState<string | null>(null);

  if (lines.length === 0) {
    if (mode !== "edit") return null;
    return (
      <Card title="Ataques">
        <p className="text-sm text-muted">
          Sem ataques. Crie ações no formulário das fontes: armas equipadas,
          talentos, traços e magias preparadas aparecem aqui.
        </p>
      </Card>
    );
  }

  return (
    <Card title="Ataques">
      <ul className="flex flex-col divide-y divide-line">
        {lines.map((line) => {
          const key = `${line.sourceId}/${line.actionId}`;
          return (
            <li
              key={key}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1 basis-40">
                <p className="truncate text-sm font-medium">{lineName(line)}</p>
                <p className="text-xs text-muted">
                  {line.resolution === "attack"
                    ? RANGE_LABEL[line.range]
                    : line.resolution === "save"
                      ? "Salvaguarda"
                      : "Sem teste"}
                  {line.attacks > 1 && ` · ×${line.attacks}`}
                </p>
                {line.description && (
                  <p className="mt-1 text-xs break-words text-muted">
                    {line.description}
                  </p>
                )}
              </div>
              <div className="ml-auto flex min-w-0 flex-wrap items-baseline justify-end gap-x-3 gap-y-1 text-sm">
                <CheckValue
                  line={line}
                  open={openKey === key}
                  onToggle={() => setOpenKey(openKey === key ? null : key)}
                />
                <span>
                  {formatDamage(line.parts)}
                  {line.onSuccess === "half" && (
                    <span className="text-xs text-muted">
                      {" "}
                      · metade no sucesso
                    </span>
                  )}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
