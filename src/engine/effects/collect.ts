import { isItemActive } from "@/engine/sources/rules";
import type { Item, Source } from "@/engine/sources/schema";

import type { Effect } from "./schema";

/*
 * Quais efeitos valem agora (design E3): fonte ativa e condições atendidas.
 */

export type ActiveEffect = { effect: Effect; source: Source };

export type ActiveEffects = {
  effects: ActiveEffect[];
  /** Armaduras e escudos ativos (equipados e, se exigirem, sintonizados). */
  armors: Item[];
  shields: Item[];
};

/** Talentos e traços sempre; itens quando ativos; magias quando em efeito. */
export function isSourceActive(source: Source): boolean {
  switch (source.kind) {
    case "feat":
    case "trait":
      return true;
    case "item":
      return isItemActive(source);
    case "spell":
      return source.active;
  }
}

export function collectActiveEffects(
  sources: readonly Source[],
): ActiveEffects {
  const active = sources.filter(isSourceActive);
  const items = active.filter(
    (source): source is Item => source.kind === "item",
  );
  const armors = items.filter((item) => item.category === "armor");
  const shields = items.filter((item) => item.category === "shield");

  const effects = active.flatMap((source) =>
    source.effects
      .filter(
        (effect) =>
          (!effect.noArmor || armors.length === 0) &&
          (!effect.noShield || shields.length === 0),
      )
      .map((effect) => ({ effect, source })),
  );
  return { effects, armors, shields };
}
