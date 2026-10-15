"use client";

import {
  FEAT_CATEGORIES,
  ITEM_CATEGORIES,
  SPELL_SCHOOLS,
  TRAIT_ORIGINS,
} from "@/engine/sources/kinds";
import {
  itemPriceSchema,
  itemQuantitySchema,
  itemWeightSchema,
  sourceDescriptionSchema,
  sourceNameSchema,
  sourceShortTextSchema,
  type Item,
  type Source,
  type Spell,
} from "@/engine/sources/schema";

import { NumberField } from "../number-field";
import { formatDecimal, parseDecimal, parseInteger } from "../parse";
import {
  FEAT_CATEGORY_LABEL,
  ITEM_CATEGORY_LABEL,
  SPELL_SCHOOL_LABEL,
  TRAIT_ORIGIN_LABEL,
  spellLevelLabel,
} from "./labels";
import { SchemaTextField } from "./schema-text-field";

/** Campos alteráveis de uma fonte, de qualquer tipo (Omit distribuído na união). */
export type SourcePatch = Source extends infer S
  ? S extends Source
    ? Partial<Omit<S, "id" | "kind">>
    : never
  : never;

const MARKDOWN_HINT =
  "Aceita **negrito**, *itálico*, listas com “- ” ou “1. ” e parágrafos separados por uma linha em branco.";

function SelectField<V extends string | number>({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name: string;
  value: V;
  options: readonly (readonly [V, string])[];
  onChange: (value: V) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={name}
        value={String(value)}
        onChange={(event) =>
          onChange(
            options.find(
              ([option]) => String(option) === event.target.value,
            )![0],
          )
        }
        className="rounded-md border border-line bg-bg px-2 py-2 text-sm"
      >
        {options.map(([option, text]) => (
          <option key={String(option)} value={String(option)}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-accent"
      />
      {label}
    </label>
  );
}

function entries<K extends string>(
  labels: Record<K, string>,
  keys: readonly K[],
) {
  return keys.map((key) => [key, labels[key]] as const);
}

const LEVELS = Array.from(
  { length: 10 },
  (_, level) => [level, spellLevelLabel(level)] as const,
);

/** Campos de uma fonte, gravados a cada alteração válida (design F5). */
export function SourceForm({
  source,
  onChange,
}: {
  source: Source;
  onChange: (patch: SourcePatch) => void;
}) {
  const field = (name: string) => `source-${source.id}-${name}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <SchemaTextField
          label="Nome"
          name={field("name")}
          value={source.name}
          schema={sourceNameSchema}
          onCommit={(name) => onChange({ name })}
        />
        {source.kind === "feat" && (
          <SelectField
            label="Categoria"
            name={field("category")}
            value={source.category}
            options={entries(FEAT_CATEGORY_LABEL, FEAT_CATEGORIES)}
            onChange={(category) => onChange({ category })}
          />
        )}
        {source.kind === "trait" && (
          <>
            <SelectField
              label="Origem"
              name={field("origin")}
              value={source.origin}
              options={entries(TRAIT_ORIGIN_LABEL, TRAIT_ORIGINS)}
              onChange={(origin) => onChange({ origin })}
            />
            <SchemaTextField
              label="De onde vem"
              name={field("from")}
              value={source.from}
              schema={sourceShortTextSchema}
              placeholder="ex.: Bárbaro, Anão"
              onCommit={(from) => onChange({ from })}
            />
          </>
        )}
      </div>

      {source.kind === "item" && (
        <ItemFields item={source} onChange={onChange} field={field} />
      )}
      {source.kind === "spell" && (
        <SpellFields spell={source} onChange={onChange} field={field} />
      )}

      <SchemaTextField
        label="Descrição"
        name={field("description")}
        value={source.description}
        schema={sourceDescriptionSchema}
        multiline
        hint={MARKDOWN_HINT}
        onCommit={(description) => onChange({ description })}
      />
    </div>
  );
}

function ItemFields({
  item,
  onChange,
  field,
}: {
  item: Item;
  onChange: (patch: SourcePatch) => void;
  field: (name: string) => string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-4">
        <SelectField
          label="Categoria"
          name={field("category")}
          value={item.category}
          options={entries(ITEM_CATEGORY_LABEL, ITEM_CATEGORIES)}
          onChange={(category) => onChange({ category })}
        />
        <NumberField
          label="Quantidade"
          name={field("quantity")}
          inputMode="numeric"
          value={item.quantity}
          parse={(text) => parseInteger(text, itemQuantitySchema)}
          onCommit={(quantity) => onChange({ quantity })}
        />
        <NumberField
          label="Peso (kg)"
          name={field("weight")}
          inputMode="decimal"
          value={item.weight}
          format={formatDecimal}
          parse={(text) => parseDecimal(text, itemWeightSchema, 2)}
          onCommit={(weight) => onChange({ weight })}
        />
        <SchemaTextField
          label="Preço"
          name={field("price")}
          value={item.price}
          schema={itemPriceSchema}
          placeholder="ex.: 15 PO"
          onCommit={(price) => onChange({ price })}
        />
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <Check
          label="Equipado"
          checked={item.equipped}
          onChange={(equipped) => onChange({ equipped })}
        />
        <Check
          label="Requer sintonização"
          checked={item.requiresAttunement}
          // Sem o requisito, não pode continuar sintonizado (design F1).
          onChange={(requiresAttunement) =>
            onChange(
              requiresAttunement
                ? { requiresAttunement }
                : { requiresAttunement, attuned: false },
            )
          }
        />
        {item.requiresAttunement && (
          <Check
            label="Sintonizado"
            checked={item.attuned}
            onChange={(attuned) => onChange({ attuned })}
          />
        )}
      </div>
    </div>
  );
}

function SpellFields({
  spell,
  onChange,
  field,
}: {
  spell: Spell;
  onChange: (patch: SourcePatch) => void;
  field: (name: string) => string;
}) {
  const text = (
    key: "spellClass" | "castingTime" | "range" | "duration",
    label: string,
    placeholder: string,
  ) => (
    <SchemaTextField
      label={label}
      name={field(key)}
      value={spell[key]}
      schema={sourceShortTextSchema}
      placeholder={placeholder}
      onCommit={(value) => onChange({ [key]: value })}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <SelectField
          label="Círculo"
          name={field("level")}
          value={spell.level}
          options={LEVELS}
          // Truques não são preparados (design F1).
          onChange={(level) =>
            onChange(level === 0 ? { level, prepared: false } : { level })
          }
        />
        <SelectField
          label="Escola"
          name={field("school")}
          value={spell.school}
          options={entries(SPELL_SCHOOL_LABEL, SPELL_SCHOOLS)}
          onChange={(school) => onChange({ school })}
        />
        {text("spellClass", "Classe", "ex.: Mago")}
        {text("castingTime", "Tempo de conjuração", "ex.: 1 ação")}
        {text("range", "Alcance", "ex.: 36 m")}
        {text("duration", "Duração", "ex.: instantânea")}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <Check
          label="Verbal (V)"
          checked={spell.verbal}
          onChange={(verbal) => onChange({ verbal })}
        />
        <Check
          label="Somático (S)"
          checked={spell.somatic}
          onChange={(somatic) => onChange({ somatic })}
        />
        <Check
          label="Material (M)"
          checked={spell.material}
          onChange={(material) => onChange({ material })}
        />
        <Check
          label="Concentração"
          checked={spell.concentration}
          onChange={(concentration) => onChange({ concentration })}
        />
        <Check
          label="Ritual"
          checked={spell.ritual}
          onChange={(ritual) => onChange({ ritual })}
        />
        {spell.level > 0 && (
          <Check
            label="Preparada"
            checked={spell.prepared}
            onChange={(prepared) => onChange({ prepared })}
          />
        )}
      </div>
      {spell.material && (
        <SchemaTextField
          label="Material"
          name={field("materialText")}
          value={spell.materialText}
          schema={sourceShortTextSchema}
          placeholder="ex.: um pouco de pó de diamante"
          onCommit={(materialText) => onChange({ materialText })}
        />
      )}
    </div>
  );
}
