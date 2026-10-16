"use client";

import { useMemo, useState } from "react";

import {
  createEntryAction,
  deleteEntryAction,
  saveEntryAction,
  searchCompendiumAction,
} from "@/app/(app)/compendium-actions";
import { Button, Card, FormMessage, TextField } from "@/components/form";
import { createSheetDocument } from "@/engine/sheet/document";
import { SOURCE_KINDS, type SourceKind } from "@/engine/sources/kinds";
import { sourceNameSchema, type Source } from "@/engine/sources/schema";
import { deriveStats } from "@/engine/stats/derive";
import type { CompendiumEntry } from "@/server/compendium/service";

import { SourceForm } from "../sheet/sources/source-form";
import { EntrySummary, KIND_LABEL } from "./entry-summary";
import { useCompendiumSearch } from "./use-compendium-search";

const SELECT = "rounded-md border border-line bg-bg px-2 py-2 text-sm";

const SAVE_ERROR = {
  invalid: "A entrada tem campos inválidos e não foi salva.",
  not_found: "Esta entrada não existe mais.",
} as const;

/** Página do admin: busca, criação, edição e exclusão de entradas (B6). */
export function CompendiumManager({
  initialEntries,
}: {
  initialEntries: CompendiumEntry[];
}) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<SourceKind | "all">("all");
  const kinds = useMemo(() => (kind === "all" ? [] : [kind]), [kind]);
  const { results, setResults, loading } = useCompendiumSearch(
    query,
    kinds,
    initialEntries,
  );
  const [editing, setEditing] = useState<Source | null>(null);
  const [message, setMessage] = useState<{
    kind: "error" | "success";
    text: string;
  } | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [newKind, setNewKind] = useState<SourceKind>("feat");
  const [newName, setNewName] = useState("");
  const [newError, setNewError] = useState<string>();
  const [busy, setBusy] = useState(false);
  // Pré-visualização das expressões com os valores de uma ficha nova (B6).
  const variables = useMemo(
    () => deriveStats(createSheetDocument("Exemplo")).variables,
    [],
  );

  async function create() {
    const parsed = sourceNameSchema.safeParse(newName);
    if (!parsed.success) {
      setNewError(parsed.error.issues[0]?.message);
      return;
    }
    setBusy(true);
    const result = await createEntryAction(newKind, parsed.data);
    setBusy(false);
    if (!result.ok) {
      setNewError(
        result.error === "limit"
          ? "O compêndio chegou ao limite de entradas."
          : "Nome inválido.",
      );
      return;
    }
    setNewName("");
    const found = await searchCompendiumAction(parsed.data, [newKind]);
    const entry = found.find((e) => e.id === result.id);
    if (entry) {
      setResults((current) =>
        [...current, entry].sort((a, b) =>
          a.source.name.localeCompare(b.source.name, "pt-BR"),
        ),
      );
      open(entry.source);
    }
  }

  function open(source: Source) {
    setEditing(source);
    setMessage(null);
    setConfirmingDelete(false);
  }

  async function save() {
    if (!editing) return;
    setBusy(true);
    const result = await saveEntryAction(editing.id, editing);
    setBusy(false);
    if (result.status !== "saved") {
      setMessage({ kind: "error", text: SAVE_ERROR[result.status] });
      return;
    }
    setResults((current) =>
      current.map((entry) =>
        entry.id === editing.id ? { ...entry, source: editing } : entry,
      ),
    );
    setMessage({ kind: "success", text: "Entrada salva." });
  }

  async function remove() {
    if (!editing) return;
    setBusy(true);
    await deleteEntryAction(editing.id);
    setBusy(false);
    setResults((current) => current.filter((e) => e.id !== editing.id));
    setEditing(null);
    setConfirmingDelete(false);
  }

  return (
    <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="flex min-w-0 flex-col gap-6">
        <Card title="Nova entrada">
          <div className="flex flex-wrap items-start gap-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="new-entry-kind" className="text-sm font-medium">
                Tipo
              </label>
              <select
                id="new-entry-kind"
                value={newKind}
                onChange={(event) =>
                  setNewKind(event.target.value as SourceKind)
                }
                className={SELECT}
              >
                {SOURCE_KINDS.map((option) => (
                  <option key={option} value={option}>
                    {KIND_LABEL[option]}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-40 flex-1">
              <TextField
                label="Nome"
                name="new-entry-name"
                value={newName}
                error={newError}
                autoComplete="off"
                onChange={(event) => {
                  setNewName(event.target.value);
                  setNewError(undefined);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void create();
                  }
                }}
              />
            </div>
            <Button
              type="button"
              className="mt-6"
              disabled={busy}
              onClick={() => void create()}
            >
              Criar
            </Button>
          </div>
        </Card>

        <Card title="Entradas">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-40 flex-1">
              <TextField
                label="Buscar"
                name="compendium-search"
                type="search"
                autoComplete="off"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <select
              aria-label="Filtrar por tipo"
              value={kind}
              onChange={(event) =>
                setKind(event.target.value as SourceKind | "all")
              }
              className={SELECT}
            >
              <option value="all">Todos os tipos</option>
              {SOURCE_KINDS.map((option) => (
                <option key={option} value={option}>
                  {KIND_LABEL[option]}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-2 text-xs text-muted" aria-live="polite">
            {loading
              ? "Buscando…"
              : `${results.length} entrada(s), em ordem alfabética (até 50).`}
          </p>
          <ul className="mt-3 flex flex-col divide-y divide-line">
            {results.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  aria-current={editing?.id === entry.id ? "true" : undefined}
                  onClick={() => open(entry.source)}
                  className="w-full rounded-md px-2 py-2 text-left hover:bg-surface-2 aria-[current=true]:bg-accent-soft"
                >
                  <EntrySummary source={entry.source} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {editing && (
        <Card
          title={`Editar ${KIND_LABEL[editing.kind].toLocaleLowerCase("pt-BR")}`}
          className="lg:sticky lg:top-20"
        >
          <SourceForm
            key={editing.id}
            source={editing}
            variables={variables}
            onChange={(patch) =>
              setEditing((current) =>
                current ? ({ ...current, ...patch } as Source) : current,
              )
            }
          />
          {message && (
            <div className="mt-4">
              <FormMessage kind={message.kind}>{message.text}</FormMessage>
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button type="button" disabled={busy} onClick={() => void save()}>
              Salvar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditing(null)}
            >
              Fechar
            </Button>
            <span className="flex-1" />
            {confirmingDelete ? (
              <>
                <span className="text-sm">Excluir “{editing.name}”?</span>
                <Button
                  type="button"
                  variant="danger"
                  disabled={busy}
                  onClick={() => void remove()}
                >
                  Confirmar exclusão
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setConfirmingDelete(false)}
                >
                  Cancelar
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setConfirmingDelete(true)}
              >
                Excluir
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
