"use client";

import { useMemo } from "react";

import { Button, Card } from "@/components/form";
import {
  deriveCompanion,
  deriveCompanionActions,
} from "@/engine/companions/derive";
import {
  MAX_COMPANIONS,
  createCompanion,
  type Companion,
} from "@/engine/companions/schema";

import type { SheetPartProps } from "../props";
import { useSheetMode } from "../sheet-mode";
import { CompanionCard } from "./companion-card";

/**
 * Seção Companheiros (spec sheet-companions, design H7): entre os atributos e
 * o painel de fontes. Sem companheiros, só aparece em Editar.
 */
export function CompanionsSection({ document, stats, update }: SheetPartProps) {
  const mode = useSheetMode();
  const { companions } = document;
  const derived = useMemo(
    () =>
      companions.map((companion) => {
        const companionStats = deriveCompanion(companion, stats);
        return {
          stats: companionStats,
          lines: deriveCompanionActions(companion, companionStats, stats),
        };
      }),
    [companions, stats],
  );

  if (companions.length === 0 && mode !== "edit") return null;

  function change(id: string, fn: (companion: Companion) => Companion) {
    update((current) => ({
      ...current,
      companions: current.companions.map((companion) =>
        companion.id === id ? fn(companion) : companion,
      ),
    }));
  }

  function move(index: number, offset: -1 | 1) {
    update((current) => {
      const next = [...current.companions];
      const [moved] = next.splice(index, 1);
      if (!moved) return current;
      next.splice(index + offset, 0, moved);
      return { ...current, companions: next };
    });
  }

  return (
    <Card
      title="Companheiros"
      actions={
        mode === "edit" && (
          <Button
            type="button"
            variant="secondary"
            disabled={companions.length >= MAX_COMPANIONS}
            onClick={() =>
              update((current) => ({
                ...current,
                companions: [
                  ...current.companions,
                  createCompanion(crypto.randomUUID()),
                ],
              }))
            }
          >
            Adicionar companheiro
          </Button>
        )
      }
    >
      {companions.length === 0 ? (
        <p className="text-sm text-muted">
          Sem companheiros. Familiares, montarias invocadas e companheiros de
          subclasse ficam aqui, com a ficha própria.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {companions.map((companion, index) => (
            <CompanionCard
              key={companion.id}
              companion={companion}
              stats={derived[index]!.stats}
              lines={derived[index]!.lines}
              mode={mode}
              index={index}
              total={companions.length}
              onChange={(fn) => change(companion.id, fn)}
              onMove={(offset) => move(index, offset)}
              onDelete={() =>
                update((current) => ({
                  ...current,
                  companions: current.companions.filter(
                    (entry) => entry.id !== companion.id,
                  ),
                }))
              }
            />
          ))}
        </ul>
      )}
    </Card>
  );
}
