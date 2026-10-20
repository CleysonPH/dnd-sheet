"use client";

import { useState } from "react";

import { Badge, Button, TextField } from "@/components/form";
import { Markdown } from "@/components/markdown";
import type { ActionLine } from "@/engine/attacks/derive";
import type { CompanionStats } from "@/engine/companions/derive";
import { companionSchema, type Companion } from "@/engine/companions/schema";
import {
  applyCompanionDamage,
  applyCompanionHealing,
  recoverCompanionHitDie,
  spendCompanionHitDie,
  toggleCompanionCondition,
} from "@/engine/companions/table";
import { trackerMax } from "@/engine/resources/trackers";
import { hitPointsAmountSchema } from "@/engine/stats/hit-points";
import { ABILITIES, SKILLS } from "@/engine/stats/keys";
import { ACTIVE_CONDITIONS, type ActiveCondition } from "@/engine/traits/keys";

import { CheckValue } from "../attacks/attacks-card";
import { RANGE_LABEL, formatDamage, lineName } from "../attacks/labels";
import { CONDITION_SUMMARY } from "../conditions";
import { ABILITY_LABEL, CONDITION_LABEL, SKILL_LABEL } from "../labels";
import type { SheetMode } from "../mode";
import { NumberField } from "../number-field";
import { formatSigned, parseInteger } from "../parse";
import { Counter } from "../resources-card";
import { useCanAct } from "../sheet-mode";
import { CompanionForm } from "./companion-form";

const CHIP =
  "inline-flex items-center rounded-full border border-line bg-surface-2 text-sm";

/** Valor do bloco com o erro da expressão, se houver (design H3). */
function BlockNumber({
  label,
  value,
  error,
}: {
  label: string;
  value: number;
  error?: string;
}) {
  return (
    <span
      title={error ? `Erro na expressão: ${error}` : undefined}
      className={`tabular-nums ${error ? "text-danger" : ""}`}
      aria-label={`${label}: ${value}${error ? ` (erro: ${error})` : ""}`}
    >
      {value}
      {error && " !"}
    </span>
  );
}

/** Seletor do círculo atual, entre o mínimo e 9 (spec: Invocação). */
function SpellLevelControl({
  companion,
  level,
  onChange,
}: {
  companion: Companion;
  level: number;
  onChange: (level: number) => void;
}) {
  const acts = useCanAct();
  const { minLevel } = companion.summon;
  return (
    <span className={CHIP}>
      {acts && (
        <button
          type="button"
          aria-label={`Descer o círculo de ${companion.name}`}
          disabled={level <= minLevel}
          onClick={() => onChange(level - 1)}
          className="px-2 py-0.5 text-muted hover:text-text disabled:opacity-40"
        >
          −
        </button>
      )}
      <span
        className={`py-0.5 font-medium tabular-nums ${acts ? "" : "px-3"}`}
        aria-label={`Círculo de ${companion.name}: ${level}`}
      >
        Círculo {level}
      </span>
      {acts && (
        <button
          type="button"
          aria-label={`Subir o círculo de ${companion.name}`}
          disabled={level >= 9}
          onClick={() => onChange(level + 1)}
          className="px-2 py-0.5 text-muted hover:text-text disabled:opacity-40"
        >
          +
        </button>
      )}
    </span>
  );
}

/** PV com dano, cura e temporário (spec: PV do companheiro). */
function HitPointsRow({
  companion,
  stats,
  onChange,
}: {
  companion: Companion;
  stats: CompanionStats;
  onChange: (change: (companion: Companion) => Companion) => void;
}) {
  const acts = useCanAct();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string>();
  const max = stats.hitPointsMax.value;
  const field = (name: string) => `companion-${companion.id}-${name}`;

  function apply(kind: "damage" | "healing") {
    const parsed = parseInteger(amount, hitPointsAmountSchema);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    const value = parsed.value;
    onChange((current) =>
      kind === "damage"
        ? applyCompanionDamage(current, max, value)
        : applyCompanionHealing(current, max, value),
    );
    setAmount("");
  }

  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
      {acts && (
        <div className="flex items-start gap-2">
          <div className="w-24">
            <TextField
              label="Quantidade"
              name={field("amount")}
              inputMode="numeric"
              autoComplete="off"
              value={amount}
              error={error}
              onChange={(event) => {
                setAmount(event.target.value);
                setError(undefined);
              }}
            />
          </div>
          <Button
            type="button"
            variant="danger"
            className="mt-6"
            aria-label={`Dano em ${companion.name}`}
            onClick={() => apply("damage")}
          >
            Dano
          </Button>
          <Button
            type="button"
            variant="success"
            className="mt-6"
            aria-label={`Cura em ${companion.name}`}
            onClick={() => apply("healing")}
          >
            Cura
          </Button>
        </div>
      )}
      {acts && (
        <div className="w-24">
          <NumberField
            label="Temporário"
            name={field("temp")}
            inputMode="numeric"
            value={companion.temp}
            parse={(text) => parseInteger(text, companionSchema.shape.temp)}
            onCommit={(temp) => onChange((current) => ({ ...current, temp }))}
          />
        </div>
      )}
      {acts && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">Dados de vida</span>
          <Button
            type="button"
            variant="secondary"
            className="px-2 py-1"
            aria-label={`Gastar dado de vida de ${companion.name}`}
            disabled={stats.hitDiceAvailable === 0}
            onClick={() =>
              onChange((current) =>
                spendCompanionHitDie(current, stats.hitDiceMax.value),
              )
            }
          >
            −
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="px-2 py-1"
            aria-label={`Recuperar dado de vida de ${companion.name}`}
            disabled={companion.hitDiceSpent === 0}
            onClick={() => onChange(recoverCompanionHitDie)}
          >
            +
          </Button>
        </div>
      )}
    </div>
  );
}

/** Condições do companheiro, só rótulos (spec: Condições do companheiro). */
function CompanionConditions({
  companion,
  onChange,
}: {
  companion: Companion;
  onChange: (change: (companion: Companion) => Companion) => void;
}) {
  const acts = useCanAct();
  const [open, setOpen] = useState<ActiveCondition | null>(null);
  const missing = ACTIVE_CONDITIONS.filter(
    (condition) => !companion.conditions.includes(condition),
  );
  if (!acts && companion.conditions.length === 0) return null;

  const toggle = (condition: ActiveCondition) =>
    onChange((current) => toggleCompanionCondition(current, condition));

  return (
    <div className="flex flex-col gap-2">
      <div
        role="group"
        aria-label={`Condições de ${companion.name}`}
        className="flex flex-wrap items-center gap-2"
      >
        {ACTIVE_CONDITIONS.filter((c) => companion.conditions.includes(c)).map(
          (condition) => (
            <span key={condition} className={CHIP}>
              <button
                type="button"
                aria-expanded={open === condition}
                title={CONDITION_SUMMARY[condition]}
                onClick={() =>
                  setOpen((current) =>
                    current === condition ? null : condition,
                  )
                }
                className={`rounded-full py-0.5 pl-3 font-medium ${acts ? "pr-1" : "pr-3"}`}
              >
                {CONDITION_LABEL[condition]}
              </button>
              {acts && (
                <button
                  type="button"
                  aria-label={`Remover ${CONDITION_LABEL[condition]} de ${companion.name}`}
                  onClick={() => {
                    toggle(condition);
                    setOpen(null);
                  }}
                  className="rounded-full px-2 py-0.5 text-muted hover:text-text"
                >
                  ×
                </button>
              )}
            </span>
          ),
        )}
        {acts && missing.length > 0 && (
          <select
            aria-label={`Acrescentar condição a ${companion.name}`}
            value=""
            onChange={(event) => {
              if (event.target.value) {
                toggle(event.target.value as ActiveCondition);
              }
            }}
            className="rounded-full border border-dashed border-line bg-surface px-3 py-0.5 text-sm text-muted"
          >
            <option value="">+ Condição</option>
            {missing.map((condition) => (
              <option key={condition} value={condition}>
                {CONDITION_LABEL[condition]}
              </option>
            ))}
          </select>
        )}
      </div>
      {open && (
        <p className="text-xs text-muted" aria-live="polite">
          <strong className="text-text">{CONDITION_LABEL[open]}:</strong>{" "}
          {CONDITION_SUMMARY[open]}
        </p>
      )}
    </div>
  );
}

/** Ações calculadas, como as linhas do cartão Ataques (design H7). */
function CompanionActions({
  companion,
  lines,
}: {
  companion: Companion;
  lines: ActionLine[];
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  if (lines.length === 0) return null;
  return (
    <ul
      aria-label={`Ações de ${companion.name}`}
      className="flex flex-col divide-y divide-line"
    >
      {lines.map((line) => (
        <li
          key={line.actionId}
          className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-1.5"
        >
          <div className="min-w-0 flex-1 basis-32">
            <p className="truncate text-sm font-medium">
              {line.name || lineName(line)}
            </p>
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
              open={openKey === line.actionId}
              onToggle={() =>
                setOpenKey(openKey === line.actionId ? null : line.actionId)
              }
            />
            <span>
              {formatDamage(line.parts)}
              {line.onSuccess === "half" && (
                <span className="text-xs text-muted"> · metade no sucesso</span>
              )}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Bloco completo: atributos, testes, sentidos e traços (spec). */
function StatBlock({
  companion,
  stats,
}: {
  companion: Companion;
  stats: CompanionStats;
}) {
  const skills = SKILLS.filter((skill) => stats.skills[skill].multiplier > 0);
  const rows: [string, string][] = [
    ["Iniciativa", formatSigned(stats.initiative)],
    ["Bônus de proficiência", formatSigned(stats.pb)],
    [
      "Salvaguardas",
      ABILITIES.map(
        (ability) =>
          `${ABILITY_LABEL[ability].short} ${formatSigned(stats.saves[ability].value)}`,
      ).join(", "),
    ],
    [
      "Perícias",
      skills.length > 0
        ? skills
            .map(
              (skill) =>
                `${SKILL_LABEL[skill]} ${formatSigned(stats.skills[skill].value)}`,
            )
            .join(", ")
        : "—",
    ],
    ["Percepção passiva", String(stats.passivePerception)],
    ["Deslocamento", companion.speed || "—"],
    ["Sentidos", companion.senses || "—"],
    ["Idiomas", companion.languages || "—"],
  ];
  return (
    <div className="flex flex-col gap-3">
      <ul
        aria-label={`Atributos de ${companion.name}`}
        className="grid grid-cols-3 gap-2 sm:grid-cols-6"
      >
        {ABILITIES.map((ability) => (
          <li
            key={ability}
            className="flex flex-col items-center rounded-md border border-line py-1.5"
          >
            <span className="text-xs font-semibold text-muted">
              {ABILITY_LABEL[ability].short}
            </span>
            <span className="font-semibold tabular-nums">
              {companion.abilities[ability]}
            </span>
            <span className="text-xs text-muted tabular-nums">
              {formatSigned(stats.mods[ability])}
            </span>
          </li>
        ))}
      </ul>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted">{label}</dt>
            <dd className="min-w-0 break-words">{value}</dd>
          </div>
        ))}
      </dl>
      <Markdown text={companion.traits} />
    </div>
  );
}

/**
 * Cartão de um companheiro (design H7): CA, PV, dados de vida, círculo,
 * condições, ações e usos; o bloco completo e, em Editar, o formulário.
 */
export function CompanionCard({
  companion,
  stats,
  lines,
  mode,
  index,
  total,
  onChange,
  onMove,
  onDelete,
}: {
  companion: Companion;
  stats: CompanionStats;
  lines: ActionLine[];
  mode: SheetMode;
  index: number;
  total: number;
  onChange: (change: (companion: Companion) => Companion) => void;
  onMove: (offset: -1 | 1) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const bodyId = `companion-${companion.id}-body`;
  const open = expanded || editing;
  const patch = (values: Partial<Companion>) =>
    onChange((current) => ({ ...current, ...values }));

  return (
    <li className="flex min-w-0 flex-col gap-3 rounded-lg border border-line bg-surface-2/40 p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="min-w-32 flex-1">
          <h3 className="truncate font-medium">{companion.name}</h3>
          {companion.descriptor && (
            <p className="truncate text-xs text-muted">
              {companion.descriptor}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {stats.spellLevel !== null && (
            <SpellLevelControl
              companion={companion}
              level={stats.spellLevel}
              onChange={(level) =>
                patch({ summon: { ...companion.summon, level } })
              }
            />
          )}
          {!editing && (
            <Button
              type="button"
              variant="secondary"
              aria-expanded={open}
              aria-controls={bodyId}
              onClick={() => setExpanded(!expanded)}
            >
              {open ? "Fechar bloco" : "Ver bloco"}
            </Button>
          )}
          {mode === "edit" && !editing && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditing(true)}
            >
              Editar
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm">
        <span>
          <span className="text-muted">CA </span>
          <strong>
            <BlockNumber label="CA" {...stats.armorClass} />
          </strong>
        </span>
        <span aria-label={`PV de ${companion.name}`}>
          <span className="text-muted">PV </span>
          <strong className="tabular-nums">{stats.hitPointsCurrent}</strong>
          <span className="text-muted"> / </span>
          <BlockNumber label="PV máximo" {...stats.hitPointsMax} />
          {companion.temp > 0 && (
            <span className="text-muted tabular-nums">
              {" "}
              (+{companion.temp} temp.)
            </span>
          )}
        </span>
        <span>
          <span className="text-muted">DV </span>
          <span className="tabular-nums">{stats.hitDiceAvailable}</span>
          <span className="text-muted"> / </span>
          <BlockNumber label="Dados de vida" {...stats.hitDiceMax} />
          <span className="text-muted"> d{companion.hitDie}</span>
        </span>
        {stats.down && <Badge tone="danger">Caído</Badge>}
      </div>

      <HitPointsRow companion={companion} stats={stats} onChange={onChange} />
      <CompanionConditions companion={companion} onChange={onChange} />
      <CompanionActions companion={companion} lines={lines} />

      {companion.trackers.length > 0 && (
        <ul
          aria-label={`Usos de ${companion.name}`}
          className="flex flex-col gap-2"
        >
          {companion.trackers.map((tracker) => {
            const { max, error } = trackerMax(tracker, stats.variables);
            return (
              <li
                key={tracker.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
                title={error}
              >
                <span className={error ? "text-danger" : ""}>
                  {tracker.name}
                </span>
                <Counter
                  label={`${tracker.name} de ${companion.name}`}
                  used={Math.min(tracker.used, max)}
                  max={max}
                  onChange={(used) =>
                    onChange((current) => ({
                      ...current,
                      trackers: current.trackers.map((t) =>
                        t.id === tracker.id ? { ...t, used } : t,
                      ),
                    }))
                  }
                />
              </li>
            );
          })}
        </ul>
      )}

      {open && (
        <div id={bodyId} className="border-t border-line pt-3">
          {editing ? (
            <div className="flex flex-col gap-4">
              <CompanionForm
                companion={companion}
                stats={stats}
                onChange={patch}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => setEditing(false)}>
                  Concluir
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  aria-label={`Subir ${companion.name}`}
                  disabled={index === 0}
                  onClick={() => onMove(-1)}
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  aria-label={`Descer ${companion.name}`}
                  disabled={index === total - 1}
                  onClick={() => onMove(1)}
                >
                  ↓
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
            <StatBlock companion={companion} stats={stats} />
          )}
        </div>
      )}
    </li>
  );
}
