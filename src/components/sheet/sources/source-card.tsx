"use client";

import { useState, type ReactNode } from "react";

import { Badge, Button } from "@/components/form";
import { Markdown } from "@/components/markdown";
import type { ExpressionVariables } from "@/engine/effects/expression";
import { currentOf, trackerMax } from "@/engine/resources/trackers";
import { isItemActive } from "@/engine/sources/rules";
import type { Item, Source, Spell } from "@/engine/sources/schema";
import type { EffectIssue } from "@/engine/stats/derive";

import type { SheetMode } from "../mode";
import {
  ARMOR_TYPE_LABEL,
  FEAT_CATEGORY_LABEL,
  ITEM_CATEGORY_LABEL,
  SPELL_SCHOOL_LABEL,
  TRAIT_ORIGIN_LABEL,
  formatWeight,
  sourceSummary,
  spellComponents,
  spellLevelLabel,
} from "./labels";
import { describeEffect } from "./effect-labels";
import { SourceForm, type SourcePatch } from "./source-form";

const TOGGLE =
  "rounded-md border border-line px-2 py-1 text-xs font-medium text-muted transition-colors hover:text-text aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent-text";

/** Ações de mesa de um item: equipar, sintonizar e quantidade (design F6). */
function ItemActions({
  item,
  onChange,
}: {
  item: Item;
  onChange: (patch: SourcePatch) => void;
}) {
  return (
    <>
      {isItemActive(item) && <Badge tone="success">Ativo</Badge>}
      <button
        type="button"
        aria-pressed={item.equipped}
        onClick={() => onChange({ equipped: !item.equipped })}
        className={TOGGLE}
      >
        Equipado
      </button>
      {item.requiresAttunement && (
        <button
          type="button"
          aria-pressed={item.attuned}
          onClick={() => onChange({ attuned: !item.attuned })}
          className={TOGGLE}
        >
          Sintonizado
        </button>
      )}
      <span className="flex items-center rounded-md border border-line text-sm">
        <button
          type="button"
          aria-label={`Diminuir quantidade de ${item.name}`}
          disabled={item.quantity === 0}
          onClick={() => onChange({ quantity: item.quantity - 1 })}
          className="px-2 py-0.5 text-muted hover:text-text disabled:opacity-40"
        >
          −
        </button>
        <span
          className="min-w-6 text-center tabular-nums"
          aria-label={`Quantidade: ${item.quantity}`}
        >
          {item.quantity}
        </span>
        <button
          type="button"
          aria-label={`Aumentar quantidade de ${item.name}`}
          disabled={item.quantity === 9999}
          onClick={() => onChange({ quantity: item.quantity + 1 })}
          className="px-2 py-0.5 text-muted hover:text-text disabled:opacity-40"
        >
          +
        </button>
      </span>
    </>
  );
}

function SpellActions({
  spell,
  onChange,
}: {
  spell: Spell;
  onChange: (patch: SourcePatch) => void;
}) {
  return (
    <>
      <button
        type="button"
        aria-pressed={spell.active}
        onClick={() => onChange({ active: !spell.active })}
        className={TOGGLE}
      >
        Em efeito
      </button>
      {spell.concentration && (
        <span title="Concentração">
          <Badge tone="accent">C</Badge>
        </span>
      )}
      {spell.ritual && (
        <span title="Ritual">
          <Badge>R</Badge>
        </span>
      )}
      {spell.level > 0 && (
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input
            type="checkbox"
            checked={spell.prepared}
            onChange={(event) => onChange({ prepared: event.target.checked })}
            className="size-4 accent-accent"
          />
          Preparada
        </label>
      )}
    </>
  );
}

function Details({ source }: { source: Source }) {
  const rows: [string, ReactNode][] = (() => {
    switch (source.kind) {
      case "feat":
        return [["Categoria", FEAT_CATEGORY_LABEL[source.category]]];
      case "trait":
        return [
          ["Origem", TRAIT_ORIGIN_LABEL[source.origin]],
          ["De onde vem", source.from || "—"],
        ];
      case "item":
        return [
          ["Categoria", ITEM_CATEGORY_LABEL[source.category]],
          ["Quantidade", source.quantity],
          ["Peso", `${formatWeight(source.weight)} cada`],
          ["Preço", source.price || "—"],
          ...(source.category === "armor"
            ? ([
                [
                  "Armadura",
                  `${ARMOR_TYPE_LABEL[source.armorType]}, CA ${source.armorBase}`,
                ],
              ] as [string, ReactNode][])
            : []),
          ...(source.category === "shield"
            ? ([["Bônus de CA", `+${source.shieldBonus}`]] as [
                string,
                ReactNode,
              ][])
            : []),
          [
            "Sintonização",
            source.requiresAttunement
              ? source.attuned
                ? "requer · sintonizado"
                : "requer · não sintonizado"
              : "não requer",
          ],
        ];
      case "spell":
        return [
          ["Círculo", spellLevelLabel(source.level)],
          ["Escola", SPELL_SCHOOL_LABEL[source.school]],
          ["Classe", source.spellClass || "—"],
          ["Tempo de conjuração", source.castingTime || "—"],
          ["Alcance", source.range || "—"],
          ["Duração", source.duration || "—"],
          ["Componentes", spellComponents(source)],
          ["Em efeito", source.active ? "sim" : "não"],
          [
            "Concentração / ritual",
            `${source.concentration ? "sim" : "não"} / ${source.ritual ? "sim" : "não"}`,
          ],
        ];
    }
  })();

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted">{label}</dt>
          <dd className="min-w-0 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Cartão de uma fonte (design F5): cabeçalho expansível com as ações de mesa,
 * detalhes e descrição; em Editar, o formulário e a exclusão confirmada.
 */
export function SourceCard({
  source,
  mode,
  editing,
  onEdit,
  onDone,
  onChange,
  onDelete,
  variables,
  issues,
}: {
  source: Source;
  variables: ExpressionVariables;
  /** Efeitos desta fonte ignorados no cálculo (ciclo ou erro). */
  issues: EffectIssue[];
  mode: SheetMode;
  editing: boolean;
  onEdit: () => void;
  onDone: () => void;
  onChange: (patch: SourcePatch) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const bodyId = `source-${source.id}-body`;
  const open = expanded || editing;

  return (
    <li className="rounded-lg border border-line bg-surface-2/40">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setExpanded(!expanded)}
          className="flex min-w-40 flex-1 items-baseline gap-2 text-left"
        >
          <span
            aria-hidden="true"
            className={`text-xs text-muted transition-transform ${open ? "rotate-90" : ""}`}
          >
            ▶
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium">{source.name}</span>
            <span className="block truncate text-xs text-muted">
              {sourceSummary(source)}
            </span>
          </span>
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {source.kind === "item" && (
            <ItemActions item={source} onChange={onChange} />
          )}
          {source.kind === "spell" && (
            <SpellActions spell={source} onChange={onChange} />
          )}
          {mode === "edit" && !editing && (
            <Button type="button" variant="secondary" onClick={onEdit}>
              Editar
            </Button>
          )}
        </div>
      </div>

      {source.trackers.length > 0 && (
        <ul
          aria-label={`Trackers de ${source.name}`}
          className="flex flex-wrap gap-1.5 px-3 pb-2"
        >
          {source.trackers.map((tracker) => {
            const { max, error } = trackerMax(tracker, variables);
            return (
              <li key={tracker.id} title={error}>
                <Badge tone={error ? "danger" : "neutral"}>
                  {tracker.name} {currentOf(max, tracker.used)}/{max}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
      {source.effects.length > 0 && (
        <ul
          aria-label={`Efeitos de ${source.name}`}
          className="flex flex-wrap gap-1.5 px-3 pb-3"
        >
          {source.effects.map((effect) => {
            const problem = issues.find(
              (issue) => issue.effectId === effect.id,
            );
            return (
              <li key={effect.id} title={problem?.message}>
                <Badge tone={problem ? "danger" : "accent"}>
                  {describeEffect(effect)}
                  {problem && ` · ${problem.message}`}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}

      {open && (
        <div id={bodyId} className="border-t border-line p-3">
          {editing ? (
            <div className="flex flex-col gap-4">
              <SourceForm
                source={source}
                variables={variables}
                onChange={onChange}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={onDone}>
                  Concluir
                </Button>
                {confirming ? (
                  <>
                    <Button type="button" variant="danger" onClick={onDelete}>
                      Confirmar exclusão
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setConfirming(false)}
                    >
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setConfirming(true)}
                  >
                    Excluir
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Details source={source} />
              <Markdown text={source.description} />
            </div>
          )}
        </div>
      )}
    </li>
  );
}
