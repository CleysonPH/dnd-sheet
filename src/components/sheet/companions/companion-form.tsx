"use client";

import type { ReactNode } from "react";

import { createAction } from "@/engine/attacks/schema";
import type { CompanionStats } from "@/engine/companions/derive";
import {
  COMPANION_HIT_DICE,
  companionSchema,
  summonSchema,
  type Companion,
} from "@/engine/companions/schema";
import { ABILITIES, PROFICIENCY_LEVELS, SKILLS } from "@/engine/stats/keys";

import { ABILITY_LABEL, PROFICIENCY_LABEL, SKILL_LABEL } from "../labels";
import { NumberField } from "../number-field";
import { parseInteger } from "../parse";
import { ActionsEditor } from "../sources/actions-editor";
import { ExpressionField } from "../sources/expression-field";
import { SchemaTextField } from "../sources/schema-text-field";
import { SelectField } from "../sources/source-form";
import { TrackersEditor } from "../sources/trackers-editor";

const shape = companionSchema.shape;

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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="mb-2 text-sm font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

const VARIABLES_HINT =
  "Variáveis: for..car e .mod (a criatura), pb (o do companheiro), nivel e conj.mod (do dono), dono.for..dono.car, dono.*.mod, dono.pb e circulo (o círculo da invocação, 0 sem invocação).";

/** Campos do companheiro, gravados a cada alteração válida (design H7). */
export function CompanionForm({
  companion,
  stats,
  onChange,
}: {
  companion: Companion;
  stats: CompanionStats;
  onChange: (patch: Partial<Companion>) => void;
}) {
  const field = (name: string) => `companion-${companion.id}-${name}`;
  const { variables } = stats;

  return (
    <div className="flex flex-col gap-6">
      <Section title="Identidade">
        <div className="grid items-start gap-3 sm:grid-cols-2">
          <SchemaTextField
            label="Nome"
            name={field("name")}
            value={companion.name}
            schema={shape.name}
            onCommit={(name) => onChange({ name })}
          />
          <SchemaTextField
            label="Descrição"
            name={field("descriptor")}
            value={companion.descriptor}
            schema={shape.descriptor}
            placeholder="ex.: Média Fera, Neutro"
            onCommit={(descriptor) => onChange({ descriptor })}
          />
        </div>
      </Section>

      <Section title="Atributos e testes">
        <div className="grid grid-cols-3 items-start gap-3 sm:grid-cols-6">
          {ABILITIES.map((ability) => (
            <NumberField
              key={ability}
              label={ABILITY_LABEL[ability].short}
              name={field(`ability-${ability}`)}
              inputMode="numeric"
              value={companion.abilities[ability]}
              parse={(text) =>
                parseInteger(text, shape.abilities.shape[ability])
              }
              onCommit={(value) =>
                onChange({
                  abilities: { ...companion.abilities, [ability]: value },
                })
              }
            />
          ))}
        </div>
        <div className="grid items-start gap-3 sm:grid-cols-[1fr_8rem]">
          <SelectField
            label="Bônus de proficiência"
            name={field("pbMode")}
            value={companion.pbMode}
            options={[
              ["owner", "O do dono"],
              ["own", "Próprio"],
            ]}
            onChange={(pbMode) => onChange({ pbMode })}
          />
          {companion.pbMode === "own" && (
            <NumberField
              label="PB próprio"
              name={field("pb")}
              inputMode="numeric"
              value={companion.pb}
              parse={(text) => parseInteger(text, shape.pb)}
              onCommit={(pb) => onChange({ pb })}
            />
          )}
        </div>
        <Check
          label="Soma o PB em todas as salvaguardas e perícias (ex.: Pack Bond)"
          checked={companion.allChecks}
          onChange={(allChecks) => onChange({ allChecks })}
        />
        <div>
          <p className="mb-1 text-sm font-medium">Salvaguardas proficientes</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {ABILITIES.map((ability) => (
              <Check
                key={ability}
                label={ABILITY_LABEL[ability].short}
                checked={companion.savingThrows[ability]}
                onChange={(checked) =>
                  onChange({
                    savingThrows: {
                      ...companion.savingThrows,
                      [ability]: checked,
                    },
                  })
                }
              />
            ))}
          </div>
        </div>
        <div className="grid items-start gap-3 grid-cols-2 sm:grid-cols-3">
          {SKILLS.map((skill) => (
            <SelectField
              key={skill}
              label={SKILL_LABEL[skill]}
              name={field(`skill-${skill}`)}
              value={companion.skills[skill]}
              options={PROFICIENCY_LEVELS.map(
                (level) => [level, PROFICIENCY_LABEL[level]] as const,
              )}
              onChange={(level) =>
                onChange({ skills: { ...companion.skills, [skill]: level } })
              }
            />
          ))}
        </div>
      </Section>

      <Section title="Defesa e vida">
        <p className="text-xs text-muted">{VARIABLES_HINT}</p>
        <div className="grid items-start gap-3 sm:grid-cols-2">
          <ExpressionField
            label="CA"
            name={field("armorClass")}
            value={companion.armorClass}
            placeholder="ex.: 12 + dono.con.mod"
            variables={variables}
            scope="companion"
            onCommit={(armorClass) => onChange({ armorClass })}
          />
          <ExpressionField
            label="PV máximo"
            name={field("hitPointsMax")}
            value={companion.hitPointsMax}
            placeholder="ex.: 5 + 5 * nivel"
            variables={variables}
            scope="companion"
            onCommit={(hitPointsMax) => onChange({ hitPointsMax })}
          />
        </div>
        <div className="grid items-start gap-3 sm:grid-cols-[1fr_8rem]">
          <ExpressionField
            label="Dados de vida"
            name={field("hitDiceCount")}
            value={companion.hitDiceCount}
            placeholder="ex.: nivel"
            variables={variables}
            scope="companion"
            onCommit={(hitDiceCount) => onChange({ hitDiceCount })}
          />
          <SelectField
            label="Dado"
            name={field("hitDie")}
            value={companion.hitDie}
            options={COMPANION_HIT_DICE.map((die) => [die, `d${die}`] as const)}
            onChange={(hitDie) => onChange({ hitDie })}
          />
        </div>
      </Section>

      <Section title="Invocação">
        <Check
          label="Invocado por magia (os valores podem usar circulo)"
          checked={companion.summon.enabled}
          onChange={(enabled) =>
            onChange({ summon: { ...companion.summon, enabled } })
          }
        />
        {companion.summon.enabled && (
          <div className="w-40">
            <NumberField
              label="Círculo mínimo"
              name={field("minLevel")}
              inputMode="numeric"
              value={companion.summon.minLevel}
              parse={(text) => parseInteger(text, summonSchema.shape.minLevel)}
              onCommit={(minLevel) =>
                onChange({
                  summon: {
                    ...companion.summon,
                    minLevel,
                    level: Math.max(companion.summon.level, minLevel),
                  },
                })
              }
            />
          </div>
        )}
      </Section>

      <Section title="Descrição">
        <div className="grid items-start gap-3 sm:grid-cols-3">
          <SchemaTextField
            label="Deslocamento"
            name={field("speed")}
            value={companion.speed}
            schema={shape.speed}
            placeholder="ex.: 12 m"
            onCommit={(speed) => onChange({ speed })}
          />
          <SchemaTextField
            label="Sentidos"
            name={field("senses")}
            value={companion.senses}
            schema={shape.senses}
            placeholder="ex.: Visão no Escuro 18 m"
            onCommit={(senses) => onChange({ senses })}
          />
          <SchemaTextField
            label="Idiomas"
            name={field("languages")}
            value={companion.languages}
            schema={shape.languages}
            onCommit={(languages) => onChange({ languages })}
          />
        </div>
        <SchemaTextField
          label="Traços"
          name={field("traits")}
          value={companion.traits}
          schema={shape.traits}
          multiline
          hint="Aceita **negrito**, *itálico*, listas e parágrafos separados por uma linha em branco."
          onCommit={(traits) => onChange({ traits })}
        />
      </Section>

      <ActionsEditor
        ownerId={companion.id}
        actions={companion.actions}
        newAction={(id) => createAction({ kind: "companion" }, id)}
        upcastApplies={false}
        variables={variables}
        scope="companion"
        hint="Ataques, salvaguardas e curas do companheiro. A conjuração usa o ataque mágico e a CD do dono. Para um acerto pelo atributo do dono, use “Sem atributo” e o bônus dono.con.mod (ex.: Mordida do Hound)."
        onChange={(actions) => onChange({ actions })}
      />

      <TrackersEditor
        sourceId={companion.id}
        trackers={companion.trackers}
        variables={variables}
        scope="companion"
        title="Usos"
        onChange={(trackers) => onChange({ trackers })}
      />
    </div>
  );
}
