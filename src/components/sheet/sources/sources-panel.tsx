"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { Badge, Button, Card, TextField } from "@/components/form";
import {
  ATTUNEMENT_LIMIT,
  attunedCount,
  createSource,
  preparedCount,
  spellsByLevel,
  totalWeight,
} from "@/engine/sources/rules";
import { sourceNameSchema, type Source } from "@/engine/sources/schema";

import type { SheetPartProps } from "../props";
import { useSheetMode } from "../sheet-mode";
import { formatWeight, spellLevelLabel } from "./labels";
import { SourceCard } from "./source-card";
import type { SourcePatch } from "./source-form";

type Tab = "features" | "inventory" | "spells";

const TABS: { tab: Tab; label: string; empty: string }[] = [
  {
    tab: "features",
    label: "Características",
    empty: "Ainda não há talentos nem traços.",
  },
  { tab: "inventory", label: "Inventário", empty: "Ainda não há itens." },
  { tab: "spells", label: "Magias", empty: "Ainda não há magias." },
];

function inTab(tab: Tab, source: Source): boolean {
  if (tab === "features")
    return source.kind === "feat" || source.kind === "trait";
  if (tab === "inventory") return source.kind === "item";
  return source.kind === "spell";
}

/** Formulário curto que cria a fonte e a abre em edição (design F5). */
function AddSource({
  tab,
  onAdd,
}: {
  tab: Tab;
  onAdd: (kind: Source["kind"], name: string) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [kind, setKind] = useState<"feat" | "trait">("trait");
  const target: Source["kind"] =
    tab === "features" ? kind : tab === "inventory" ? "item" : "spell";

  function submit() {
    const parsed = sourceNameSchema.safeParse(name);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    onAdd(target, parsed.data);
    setName("");
  }

  return (
    // Não é <form>: a ficha inteira já está dentro de um <fieldset>.
    <div className="mb-4 flex flex-wrap items-start gap-2">
      <div className="min-w-48 flex-1">
        <TextField
          label={
            tab === "features"
              ? "Nova característica"
              : tab === "inventory"
                ? "Novo item"
                : "Nova magia"
          }
          name={`new-source-${tab}`}
          value={name}
          error={error}
          autoComplete="off"
          onChange={(event) => {
            setName(event.target.value);
            setError(undefined);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
        />
      </div>
      {tab === "features" && (
        <div className="flex flex-col gap-1">
          <label htmlFor="new-source-kind" className="text-sm font-medium">
            Tipo
          </label>
          <select
            id="new-source-kind"
            value={kind}
            onChange={(event) =>
              setKind(event.target.value as "feat" | "trait")
            }
            className="rounded-md border border-line bg-bg px-2 py-2 text-sm"
          >
            <option value="trait">Traço</option>
            <option value="feat">Talento</option>
          </select>
        </div>
      )}
      <Button type="button" className="mt-6" onClick={submit}>
        Adicionar
      </Button>
    </div>
  );
}

/** Abas Características | Inventário | Magias (spec sheet-sources). */
export function SourcesPanel({ document, stats, update }: SheetPartProps) {
  const mode = useSheetMode();
  const [tab, setTab] = useState<Tab>("features");
  const [editingId, setEditingId] = useState<string | null>(null);
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({
    features: null,
    inventory: null,
    spells: null,
  });
  const { sources } = document;

  function patchSource(id: string, patch: SourcePatch) {
    update((current) => ({
      ...current,
      sources: current.sources.map((source) =>
        source.id === id ? ({ ...source, ...patch } as Source) : source,
      ),
    }));
  }

  function addSource(kind: Source["kind"], name: string) {
    const source = createSource(kind, name, crypto.randomUUID());
    update((current) => ({
      ...current,
      sources: [...current.sources, source],
    }));
    setEditingId(source.id);
  }

  function deleteSource(id: string) {
    update((current) => ({
      ...current,
      sources: current.sources.filter((source) => source.id !== id),
    }));
    setEditingId(null);
  }

  function onTabKey(event: KeyboardEvent, index: number) {
    const delta =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = TABS[(index + delta + TABS.length) % TABS.length]!.tab;
    setTab(next);
    tabRefs.current[next]?.focus();
  }

  const card = (source: Source) => (
    <SourceCard
      key={source.id}
      source={source}
      mode={mode}
      editing={mode === "edit" && editingId === source.id}
      onEdit={() => setEditingId(source.id)}
      onDone={() => setEditingId(null)}
      onChange={(patch) => patchSource(source.id, patch)}
      onDelete={() => deleteSource(source.id)}
      variables={stats.variables}
      issues={stats.issues.filter((issue) => issue.sourceId === source.id)}
    />
  );

  const visible = sources.filter((source) => inTab(tab, source));
  const current = TABS.find((entry) => entry.tab === tab)!;

  let summary: ReactNode = null;
  if (tab === "inventory") {
    const attuned = attunedCount(sources);
    summary = (
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
        <span>
          Carga total:{" "}
          <strong className="text-text">
            {formatWeight(totalWeight(sources))}
          </strong>
        </span>
        <span>
          Sintonizados:{" "}
          <strong className="text-text">
            {attuned}/{ATTUNEMENT_LIMIT}
          </strong>
        </span>
        {attuned > ATTUNEMENT_LIMIT && (
          <Badge tone="danger">
            Mais de {ATTUNEMENT_LIMIT} itens sintonizados
          </Badge>
        )}
      </div>
    );
  } else if (tab === "spells") {
    summary = (
      <p className="mb-3 text-sm text-muted">
        Preparadas:{" "}
        <strong className="text-text">{preparedCount(sources)}</strong>
      </p>
    );
  }

  return (
    <Card>
      <div
        role="tablist"
        aria-label="Fontes do personagem"
        className="mb-4 flex border-b border-line sm:gap-1"
      >
        {TABS.map((entry, index) => {
          const count = sources.filter((source) =>
            inTab(entry.tab, source),
          ).length;
          const selected = entry.tab === tab;
          return (
            <button
              key={entry.tab}
              ref={(element) => {
                tabRefs.current[entry.tab] = element;
              }}
              type="button"
              role="tab"
              id={`tab-${entry.tab}`}
              aria-selected={selected}
              aria-controls={`panel-${entry.tab}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(entry.tab)}
              onKeyDown={(event) => onTabKey(event, index)}
              className="flex-1 border-b-2 border-transparent px-1 py-2 text-xs sm:flex-none sm:px-3 sm:text-sm font-medium whitespace-nowrap text-muted hover:text-text aria-selected:border-accent aria-selected:text-text"
            >
              {entry.label} <span className="block sm:inline">({count})</span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {mode === "edit" && <AddSource key={tab} tab={tab} onAdd={addSource} />}
        {summary}
        {visible.length === 0 ? (
          <p className="text-sm text-muted">{current.empty}</p>
        ) : tab === "spells" ? (
          <div className="flex flex-col gap-4">
            {spellsByLevel(sources).map((group) => (
              <section key={group.level}>
                <h3 className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
                  {group.level === 0 ? "Truques" : spellLevelLabel(group.level)}
                </h3>
                <ul className="flex flex-col gap-2">
                  {group.spells.map(card)}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <ul className="flex flex-col gap-2">{visible.map(card)}</ul>
        )}
      </div>
    </Card>
  );
}
