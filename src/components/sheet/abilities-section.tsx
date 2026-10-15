"use client";

import { abilityScoreSchema } from "@/engine/sheet/document";
import { ABILITIES } from "@/engine/stats/keys";

import { DerivedValue } from "./derived-value";
import { ABILITY_LABEL } from "./labels";
import { NumberField } from "./number-field";
import { parseInteger } from "./parse";
import { Section, type SectionProps } from "./section";

/** Atributos com modificador, e salvaguardas com proficiência marcável. */
export function AbilitiesSection({ document, stats, update }: SectionProps) {
  return (
    <Section title="Atributos" area="abilities">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
        {ABILITIES.map((ability) => (
          <div
            key={ability}
            className="flex flex-col gap-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
          >
            <NumberField
              label={ABILITY_LABEL[ability].name}
              name={`ability-${ability}`}
              inputMode="numeric"
              value={document.abilities[ability]}
              parse={(text) => parseInteger(text, abilityScoreSchema)}
              onCommit={(score) =>
                update({
                  abilities: { ...document.abilities, [ability]: score },
                })
              }
            />
            <div className="flex items-baseline justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <span>Mod.</span>
              <DerivedValue
                valueKey={`mod.${ability}`}
                derived={stats.values[`mod.${ability}`]}
                signed
                className="text-2xl text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
        ))}
      </div>

      <h3 className="mt-5 mb-2 text-sm font-semibold">Salvaguardas</h3>
      <ul className="flex flex-col gap-1">
        {ABILITIES.map((ability) => (
          <li key={ability} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              id={`save-${ability}`}
              checked={document.savingThrows[ability]}
              onChange={(event) =>
                update({
                  savingThrows: {
                    ...document.savingThrows,
                    [ability]: event.target.checked,
                  },
                })
              }
              aria-label={`Proficiente na salvaguarda de ${ABILITY_LABEL[ability].name}`}
              className="size-4"
            />
            <label htmlFor={`save-${ability}`} className="flex-1">
              {ABILITY_LABEL[ability].name}
            </label>
            <DerivedValue
              valueKey={`save.${ability}`}
              derived={stats.values[`save.${ability}`]}
              signed
              align="right"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
