import type { SheetDocument } from "@/engine/sheet/document";
import { ABILITIES } from "@/engine/stats/keys";

/** Modos da ficha (design V4): leitura na mesa ou edição completa. */
export type SheetMode = "play" | "edit";

/**
 * Ficha com algum atributo preenchido abre em Jogar; com todos ainda no valor
 * inicial (10), abre em Editar.
 */
export function initialSheetMode(document: SheetDocument): SheetMode {
  return ABILITIES.some((ability) => document.abilities[ability] !== 10)
    ? "play"
    : "edit";
}
