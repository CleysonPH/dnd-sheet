"use client";

import { abilityScoreSchema } from "@/engine/sheet/document";
import {
  PROFICIENCY_LEVELS,
  SKILLS,
  SKILL_ABILITY,
  type Ability,
  type ProficiencyLevel,
} from "@/engine/stats/keys";

import { DerivedValue } from "./derived-value";
import { ABILITY_LABEL, PROFICIENCY_LABEL, SKILL_LABEL } from "./labels";
import { NumberField } from "./number-field";
import { parseInteger } from "./parse";
import type { SheetPartProps } from "./props";
import { useSheetMode } from "./sheet-mode";

const MARK: Record<ProficiencyLevel, string> = {
  none: "○",
  proficient: "●",
  expertise: "◉",
};

function nextLevel(level: ProficiencyLevel): ProficiencyLevel {
  const index = PROFICIENCY_LEVELS.indexOf(level);
  return PROFICIENCY_LEVELS[(index + 1) % PROFICIENCY_LEVELS.length]!;
}

const ROW = "flex min-w-0 items-center gap-2 py-0.5 text-sm";
const MARK_STYLE =
  "flex size-6 shrink-0 items-center justify-center text-base leading-none text-accent-text";

/**
 * Bloco de um atributo (design V5): emblema com valor e modificador, e ao lado
 * a salvaguarda e as perícias daquele atributo.
 */
export function AbilityBlock({
  ability,
  document,
  stats,
  update,
}: SheetPartProps & { ability: Ability }) {
  const mode = useSheetMode();
  const { name } = ABILITY_LABEL[ability];
  const skills = SKILLS.filter((skill) => SKILL_ABILITY[skill] === ability);
  const saveProficient = document.savingThrows[ability];
  // Valor final, já com os efeitos das fontes (design E6).
  const score = stats.abilityScores[ability];

  return (
    <article
      aria-label={name}
      className="flex min-w-0 gap-4 rounded-xl border border-line bg-surface p-4"
    >
      <div className="flex w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-line bg-surface-2 px-2 py-3 text-center ring-1 ring-line ring-offset-2 ring-offset-surface">
        {mode === "edit" ? (
          <NumberField
            label={name}
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
        ) : (
          <span
            className="text-sm text-muted tabular-nums"
            title={
              score.value !== score.base
                ? `Valor na ficha ${score.base}; com efeitos ${score.value}`
                : undefined
            }
          >
            {score.value}
          </span>
        )}
        {mode === "edit" && score.value !== score.base && (
          <span className="text-xs text-muted">efetivo {score.value}</span>
        )}
        <DerivedValue
          valueKey={`mod.${ability}`}
          derived={stats.values[`mod.${ability}`]}
          signed
          className="text-3xl"
        />
        {mode !== "edit" && (
          <span className="text-xs font-semibold tracking-wide uppercase">
            {name}
          </span>
        )}
      </div>

      <ul className="flex min-w-0 flex-1 flex-col justify-center">
        <li className={`${ROW} border-b border-line pb-1`}>
          {mode === "edit" ? (
            <span className={MARK_STYLE}>
              <input
                type="checkbox"
                id={`save-${ability}`}
                checked={saveProficient}
                onChange={(event) =>
                  update({
                    savingThrows: {
                      ...document.savingThrows,
                      [ability]: event.target.checked,
                    },
                  })
                }
                aria-label={`Proficiente na salvaguarda de ${name}`}
                className="size-4 accent-accent"
              />
            </span>
          ) : (
            <span className={MARK_STYLE} aria-hidden="true">
              {saveProficient ? MARK.proficient : MARK.none}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate font-medium">
            Salvaguarda
            {mode !== "edit" && saveProficient && (
              <span className="sr-only"> (proficiente)</span>
            )}
          </span>
          <DerivedValue
            valueKey={`save.${ability}`}
            derived={stats.values[`save.${ability}`]}
            signed
            align="right"
          />
        </li>
        {skills.map((skill) => {
          const level = document.skills[skill];
          return (
            <li key={skill} className={ROW}>
              {mode === "edit" ? (
                <button
                  type="button"
                  data-level={level}
                  aria-label={`${SKILL_LABEL[skill]}: ${PROFICIENCY_LABEL[level]}. Alternar proficiência`}
                  onClick={() =>
                    update({
                      skills: {
                        ...document.skills,
                        [skill]: nextLevel(level),
                      },
                    })
                  }
                  className={`${MARK_STYLE} rounded hover:bg-surface-2`}
                >
                  {MARK[level]}
                </button>
              ) : (
                <span className={MARK_STYLE} aria-hidden="true">
                  {MARK[level]}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate">
                {SKILL_LABEL[skill]}
                {mode !== "edit" && level !== "none" && (
                  <span className="sr-only"> ({PROFICIENCY_LABEL[level]})</span>
                )}
              </span>
              <DerivedValue
                valueKey={`skill.${skill}`}
                derived={stats.values[`skill.${skill}`]}
                signed
                align="right"
              />
            </li>
          );
        })}
      </ul>
    </article>
  );
}
