import type { SheetDocument } from "@/engine/sheet/document";
import type { Source, Spell } from "@/engine/sources/schema";

/*
 * Concentração (design I2). Não há campo próprio: o personagem está
 * concentrado na magia de concentração que está em efeito.
 */

function isConcentrating(source: Source): source is Spell {
  return source.kind === "spell" && source.concentration && source.active;
}

/**
 * A magia em que o personagem está concentrado: a primeira, na ordem da
 * ficha, com concentração e em efeito. Numa ficha antiga com duas, a primeira.
 */
export function concentratingSpell(sources: readonly Source[]): Spell | null {
  return sources.find(isConcentrating) ?? null;
}

/** Tira de efeito todas as magias de concentração. */
export function endConcentration(document: SheetDocument): SheetDocument {
  if (!concentratingSpell(document.sources)) return document;
  return {
    ...document,
    sources: document.sources.map((source) =>
      isConcentrating(source) ? { ...source, active: false } : source,
    ),
  };
}

/**
 * CD do teste de resistência de Constituição para manter a concentração:
 * metade do dano, arredondada para baixo, no mínimo 10 e no máximo 30.
 */
export function concentrationSaveDc(damage: number): number {
  return Math.min(30, Math.max(10, Math.floor(damage / 2)));
}

/**
 * Uma concentração por vez: se a fonte alterada é uma magia de concentração
 * em efeito, as outras magias de concentração saem de efeito.
 */
export function enforceSingleConcentration(
  sources: readonly Source[],
  changedId: string,
): Source[] {
  const changed = sources.find((source) => source.id === changedId);
  if (!changed || !isConcentrating(changed)) return [...sources];
  return sources.map((source) =>
    source.id !== changedId && isConcentrating(source)
      ? { ...source, active: false }
      : source,
  );
}
