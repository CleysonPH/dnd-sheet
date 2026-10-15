"use client";

import {
  PROFICIENCY_LEVELS,
  SKILLS,
  SKILL_ABILITY,
  type ProficiencyLevel,
} from "@/engine/stats/keys";

import { DerivedValue } from "./derived-value";
import { ABILITY_LABEL, PROFICIENCY_LABEL, SKILL_LABEL } from "./labels";
import { Section, type SectionProps } from "./section";

const MARK: Record<ProficiencyLevel, string> = {
  none: "○",
  proficient: "●",
  expertise: "◉",
};

function nextLevel(level: ProficiencyLevel): ProficiencyLevel {
  const index = PROFICIENCY_LEVELS.indexOf(level);
  return PROFICIENCY_LEVELS[(index + 1) % PROFICIENCY_LEVELS.length]!;
}

/** As 18 perícias, cada uma com nível de proficiência e bônus. */
export function SkillsSection({ document, stats, update }: SectionProps) {
  return (
    <Section title="Perícias" area="skills">
      <p className="mb-2 text-xs text-zinc-500">
        Toque no círculo para alternar: ○ sem proficiência, ● proficiente, ◉
        expertise.
      </p>
      <ul className="flex flex-col">
        {SKILLS.map((skill) => {
          const level = document.skills[skill];
          return (
            <li
              key={skill}
              className="flex items-center gap-2 border-b border-zinc-100 py-1 text-sm last:border-0 dark:border-zinc-900"
            >
              <button
                type="button"
                data-level={level}
                aria-label={`${SKILL_LABEL[skill]}: ${PROFICIENCY_LABEL[level]}. Alternar proficiência`}
                onClick={() =>
                  update({
                    skills: { ...document.skills, [skill]: nextLevel(level) },
                  })
                }
                className="flex size-7 shrink-0 items-center justify-center rounded text-lg leading-none hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {MARK[level]}
              </button>
              <span className="min-w-0 flex-1 truncate">
                {SKILL_LABEL[skill]}{" "}
                <span className="text-xs text-zinc-500">
                  ({ABILITY_LABEL[SKILL_ABILITY[skill]].short})
                </span>
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
    </Section>
  );
}
