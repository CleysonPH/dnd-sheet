"use client";

import { useState } from "react";

import { Button, Card } from "@/components/form";
import type { SheetDocument } from "@/engine/sheet/document";
import { deriveTraits, type TraitEntry } from "@/engine/traits/derive";
import {
  ARMOR_PROFICIENCIES,
  CONDITIONS,
  DAMAGE_TYPES,
  WEAPON_CATEGORIES,
  tagKey,
  type ArmorProficiency,
  type Condition,
  type DamageType,
  type WeaponCategory,
} from "@/engine/traits/keys";
import { tagListSchema, tagSchema } from "@/engine/traits/schema";

import {
  ARMOR_PROFICIENCY_LABEL,
  CONDITION_LABEL,
  DAMAGE_TYPE_LABEL,
  WEAPON_CATEGORY_LABEL,
} from "./labels";
import type { SheetPartProps } from "./props";
import { useSheetMode } from "./sheet-mode";
import {
  LANGUAGE_SUGGESTIONS,
  TOOL_SUGGESTIONS,
  WEAPON_SUGGESTIONS,
} from "./suggestions";

/*
 * Cartões Proficiências e Defesas (design T3/T7): o que o jogador marca mais o
 * que as fontes ativas concedem. Fora de Editar, listas vazias somem.
 */

const TOGGLE =
  "rounded-md border border-line px-2 py-1 text-xs font-medium text-muted transition-colors hover:text-text disabled:cursor-not-allowed aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent-text";

/** Nomes das fontes que concedem o item, para mostrar a origem. */
function sourceNames(entry: TraitEntry | undefined): string {
  return entry ? entry.sources.map((source) => source.name).join(", ") : "";
}

function Origin({ entry }: { entry: TraitEntry | undefined }) {
  const names = sourceNames(entry);
  return names ? <span className="text-xs text-muted">({names})</span> : null;
}

/** Linha só de leitura: "Armaduras: Leve, Média (Talento)". */
function TraitLine({
  title,
  entries,
  labelOf,
}: {
  title: string;
  entries: TraitEntry[];
  labelOf: (entry: TraitEntry) => string;
}) {
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium text-muted">{title}</dt>
      <dd className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
        {entries.map((entry) => (
          <span key={entry.key} className="inline-flex items-baseline gap-1">
            {labelOf(entry)}
            <Origin entry={entry} />
          </span>
        ))}
      </dd>
    </div>
  );
}

/** Caixas de uma lista fechada; a concedida fica marcada e travada. */
function ClosedChecks<K extends string>({
  title,
  keys,
  labels,
  checked,
  entries,
  onChange,
}: {
  title: string;
  keys: readonly K[];
  labels: Record<K, string>;
  checked: (key: K) => boolean;
  entries: TraitEntry[];
  onChange: (key: K, value: boolean) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 text-xs font-medium text-muted">{title}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {keys.map((key) => {
          const entry = entries.find((e) => e.key === key);
          const granted = (entry?.sources.length ?? 0) > 0;
          return (
            <label
              key={key}
              className="inline-flex items-center gap-1.5 text-sm"
            >
              <input
                type="checkbox"
                className="size-4 accent-accent"
                checked={granted || checked(key)}
                disabled={granted}
                onChange={(event) => onChange(key, event.target.checked)}
              />
              {labels[key]}
              <Origin entry={entry} />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Etiquetas livres com sugestões; as concedidas não têm "×" (spec). */
function TagEditor({
  title,
  name,
  tags,
  entries,
  suggestions,
  onChange,
}: {
  title: string;
  name: string;
  tags: string[];
  entries: TraitEntry[];
  suggestions: string[];
  onChange: (tags: string[]) => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string>();
  const free = entries.filter((entry) => !entry.closed);

  function add() {
    const parsed = tagSchema.safeParse(text);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    if (tags.some((tag) => tagKey(tag) === tagKey(parsed.data))) {
      setError("Esse item já está na lista");
      return;
    }
    const next = tagListSchema.safeParse([...tags, parsed.data]);
    if (!next.success) {
      setError(next.error.issues[0]?.message);
      return;
    }
    onChange(next.data);
    setText("");
    setError(undefined);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-xs font-medium text-muted">
        {title}
      </label>
      {free.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {free.map((entry) => {
            const removable = entry.fromSheet && entry.sources.length === 0;
            return (
              <li
                key={entry.key}
                className={`inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 py-0.5 pl-3 text-sm ${removable ? "" : "pr-3"}`}
              >
                {entry.label}
                <Origin entry={entry} />
                {removable ? (
                  <button
                    type="button"
                    aria-label={`Remover ${entry.label}`}
                    onClick={() =>
                      onChange(
                        tags.filter(
                          (tag) => tagKey(tag) !== tagKey(entry.label),
                        ),
                      )
                    }
                    className="rounded-full px-2 text-muted hover:text-text"
                  >
                    ×
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <input
            id={name}
            name={name}
            list={`${name}-suggestions`}
            autoComplete="off"
            value={text}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${name}-error` : undefined}
            onChange={(event) => {
              setText(event.target.value);
              setError(undefined);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                add();
              }
            }}
            className="w-full min-w-0 rounded-md border border-line bg-bg px-3 py-1.5 text-sm outline-none focus:border-accent aria-invalid:border-danger"
          />
          <datalist id={`${name}-suggestions`}>
            {suggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
          {error && (
            <p id={`${name}-error`} className="mt-1 text-sm text-danger">
              {error}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="secondary"
          className="py-1.5"
          onClick={add}
        >
          Acrescentar
        </Button>
      </div>
    </div>
  );
}

const armorLabel = (entry: TraitEntry) =>
  ARMOR_PROFICIENCY_LABEL[entry.key as ArmorProficiency];
const weaponLabel = (entry: TraitEntry) =>
  entry.closed
    ? WEAPON_CATEGORY_LABEL[entry.key as WeaponCategory]
    : entry.label;
const freeLabel = (entry: TraitEntry) => entry.label;
const damageLabel = (entry: TraitEntry) =>
  DAMAGE_TYPE_LABEL[entry.key as DamageType];
const conditionLabel = (entry: TraitEntry) =>
  CONDITION_LABEL[entry.key as Condition].toLocaleLowerCase("pt-BR");

export function ProficienciesCard({ document, update }: SheetPartProps) {
  const mode = useSheetMode();
  const traits = deriveTraits(document);
  const { proficiencies } = document;

  function patch(change: Partial<SheetDocument["proficiencies"]>) {
    update((current) => ({
      ...current,
      proficiencies: { ...current.proficiencies, ...change },
    }));
  }

  if (mode !== "edit") {
    const lists = [
      traits.armor,
      traits.weapons,
      traits.tools,
      traits.languages,
    ];
    if (lists.every((list) => list.length === 0)) return null;
    return (
      <Card title="Proficiências">
        <dl className="flex flex-col gap-3">
          <TraitLine
            title="Armaduras"
            entries={traits.armor}
            labelOf={armorLabel}
          />
          <TraitLine
            title="Armas"
            entries={traits.weapons}
            labelOf={weaponLabel}
          />
          <TraitLine
            title="Ferramentas"
            entries={traits.tools}
            labelOf={freeLabel}
          />
          <TraitLine
            title="Idiomas"
            entries={traits.languages}
            labelOf={freeLabel}
          />
        </dl>
      </Card>
    );
  }

  return (
    <Card title="Proficiências">
      <div className="flex flex-col gap-4">
        <ClosedChecks
          title="Armaduras"
          keys={ARMOR_PROFICIENCIES}
          labels={ARMOR_PROFICIENCY_LABEL}
          checked={(key) => proficiencies.armor[key]}
          entries={traits.armor}
          onChange={(key, value) =>
            patch({ armor: { ...proficiencies.armor, [key]: value } })
          }
        />
        <ClosedChecks
          title="Armas"
          keys={WEAPON_CATEGORIES}
          labels={WEAPON_CATEGORY_LABEL}
          checked={(key) => proficiencies.weapons[key]}
          entries={traits.weapons}
          onChange={(key, value) =>
            patch({ weapons: { ...proficiencies.weapons, [key]: value } })
          }
        />
        <TagEditor
          title="Armas específicas"
          name="prof-weapons"
          tags={proficiencies.weapons.other}
          entries={traits.weapons}
          suggestions={WEAPON_SUGGESTIONS}
          onChange={(other) =>
            patch({ weapons: { ...proficiencies.weapons, other } })
          }
        />
        <TagEditor
          title="Ferramentas"
          name="prof-tools"
          tags={proficiencies.tools}
          entries={traits.tools}
          suggestions={TOOL_SUGGESTIONS}
          onChange={(tools) => patch({ tools })}
        />
        <TagEditor
          title="Idiomas"
          name="prof-languages"
          tags={proficiencies.languages}
          entries={traits.languages}
          suggestions={LANGUAGE_SUGGESTIONS}
          onChange={(languages) => patch({ languages })}
        />
      </div>
    </Card>
  );
}

/** Botões de uma lista fechada de defesa; o concedido fica marcado e travado. */
function DefenseToggles<K extends string>({
  title,
  keys,
  labels,
  selected,
  entries,
  onChange,
}: {
  title: string;
  keys: readonly K[];
  labels: Record<K, string>;
  selected: readonly K[];
  entries: TraitEntry[];
  onChange: (list: K[]) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 text-xs font-medium text-muted">{title}</legend>
      <div className="flex flex-wrap gap-1.5">
        {keys.map((key) => {
          const entry = entries.find((e) => e.key === key);
          const granted = (entry?.sources.length ?? 0) > 0;
          const pressed = granted || selected.includes(key);
          return (
            <button
              key={key}
              type="button"
              aria-pressed={pressed}
              disabled={granted}
              title={
                granted ? `Concedido por ${sourceNames(entry)}` : undefined
              }
              onClick={() =>
                onChange(
                  // Mantém a ordem da lista fechada.
                  keys.filter((k) =>
                    k === key ? !pressed : selected.includes(k),
                  ),
                )
              }
              className={TOGGLE}
            >
              {labels[key]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

const CONDITION_LOWER = Object.fromEntries(
  CONDITIONS.map((condition) => [
    condition,
    CONDITION_LABEL[condition].toLocaleLowerCase("pt-BR"),
  ]),
) as Record<Condition, string>;

export function DefensesCard({ document, update }: SheetPartProps) {
  const mode = useSheetMode();
  const traits = deriveTraits(document);
  const { defenses } = document;

  function patch(change: Partial<SheetDocument["defenses"]>) {
    update((current) => ({
      ...current,
      defenses: { ...current.defenses, ...change },
    }));
  }

  if (mode !== "edit") {
    const lists = [
      traits.resistances,
      traits.immunities,
      traits.vulnerabilities,
      traits.conditionImmunities,
    ];
    if (lists.every((list) => list.length === 0)) return null;
    return (
      <Card title="Defesas">
        <dl className="flex flex-col gap-3">
          <TraitLine
            title="Resistência"
            entries={traits.resistances}
            labelOf={damageLabel}
          />
          <TraitLine
            title="Imunidade"
            entries={traits.immunities}
            labelOf={damageLabel}
          />
          <TraitLine
            title="Vulnerabilidade"
            entries={traits.vulnerabilities}
            labelOf={damageLabel}
          />
          <TraitLine
            title="Imunidade a condição"
            entries={traits.conditionImmunities}
            labelOf={conditionLabel}
          />
        </dl>
      </Card>
    );
  }

  const damage = (
    title: string,
    list: "resistances" | "immunities" | "vulnerabilities",
  ) => (
    <DefenseToggles
      title={title}
      keys={DAMAGE_TYPES}
      labels={DAMAGE_TYPE_LABEL}
      selected={defenses[list]}
      entries={traits[list]}
      onChange={(next) => patch({ [list]: next })}
    />
  );

  return (
    <Card title="Defesas">
      <div className="flex flex-col gap-4">
        {damage("Resistência", "resistances")}
        {damage("Imunidade", "immunities")}
        {damage("Vulnerabilidade", "vulnerabilities")}
        <DefenseToggles
          title="Imunidade a condição"
          keys={CONDITIONS}
          labels={CONDITION_LOWER}
          selected={defenses.conditionImmunities}
          entries={traits.conditionImmunities}
          onChange={(conditionImmunities) => patch({ conditionImmunities })}
        />
      </div>
    </Card>
  );
}
