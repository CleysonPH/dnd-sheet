"use client";

import { useMemo, useState } from "react";

import { Button, TextField } from "@/components/form";
import { SOURCE_KINDS, type SourceKind } from "@/engine/sources/kinds";
import type { Source } from "@/engine/sources/schema";
import { searchKey } from "@/engine/sources/search";

import { EntrySummary, KIND_LABEL } from "./entry-summary";
import { useCompendiumSearch } from "./use-compendium-search";

/** Tipo do dado arrastado de um resultado até a lista de fontes (B7). */
export const COMPENDIUM_DRAG_TYPE = "application/x-dnd-sheet-source";

const SELECT = "rounded-md border border-line bg-bg px-2 py-2 text-sm";

/**
 * Painel de busca do compêndio na ficha (spec compendium, design B7). Abre
 * filtrado pelos tipos da aba; "Adicionar" ou arrastar copia a entrada.
 */
export function CompendiumPanel({
  tabKinds,
  sheetSources,
  onAdd,
}: {
  tabKinds: SourceKind[];
  sheetSources: readonly Source[];
  onAdd: (source: Source) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"tab" | "all" | SourceKind>("tab");
  const kinds = useMemo(
    () => (filter === "tab" ? tabKinds : filter === "all" ? [] : [filter]),
    [filter, tabKinds],
  );
  const { results, loading } = useCompendiumSearch(query, kinds);
  const sheetNames = useMemo(
    () => new Set(sheetSources.map((source) => searchKey(source.name))),
    [sheetSources],
  );

  return (
    <section
      aria-label="Compêndio"
      className="flex flex-col gap-3 rounded-lg border border-line bg-surface-2 p-3"
    >
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-40 flex-1">
          <TextField
            label="Buscar no compêndio"
            name="compendium-query"
            type="search"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <select
          aria-label="Tipo"
          value={filter}
          onChange={(event) => setFilter(event.target.value as typeof filter)}
          className={SELECT}
        >
          <option value="tab">Desta aba</option>
          <option value="all">Todos os tipos</option>
          {SOURCE_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {KIND_LABEL[kind]}
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs text-muted" aria-live="polite">
        {loading
          ? "Buscando…"
          : results.length === 0
            ? "Nada encontrado."
            : `${results.length} resultado(s). Adicione ou arraste para a lista.`}
      </p>
      <ul className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto">
        {results.map((entry) => (
          <li
            key={entry.id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "copy";
              event.dataTransfer.setData(
                COMPENDIUM_DRAG_TYPE,
                JSON.stringify(entry.source),
              );
            }}
            className="flex items-start justify-between gap-2 rounded-md border border-line bg-surface p-2 sm:cursor-grab"
          >
            <EntrySummary
              source={entry.source}
              badge={
                sheetNames.has(searchKey(entry.source.name))
                  ? "já na ficha"
                  : undefined
              }
            />
            <Button
              type="button"
              variant="secondary"
              className="shrink-0 py-1"
              aria-label={`Adicionar ${entry.source.name}`}
              onClick={() => onAdd(entry.source)}
            >
              Adicionar
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
