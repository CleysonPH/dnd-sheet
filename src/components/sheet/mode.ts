import type { SheetDocument } from "@/engine/sheet/document";
import { ABILITIES } from "@/engine/stats/keys";

/**
 * Modos da ficha (design V4): mesa ou edição completa. "view" é a leitura da
 * ficha compartilhada, sem nada que altere a ficha (design L4).
 */
export type SheetMode = "play" | "edit" | "view";

/** Se o modo permite alterar a ficha (dano, recursos, ações das fontes...). */
export function canAct(mode: SheetMode): boolean {
  return mode !== "view";
}

/**
 * Ficha com algum atributo preenchido abre em Jogar; com todos ainda no valor
 * inicial (10), abre em Editar.
 */
export function initialSheetMode(document: SheetDocument): SheetMode {
  return ABILITIES.some((ability) => document.abilities[ability] !== 10)
    ? "play"
    : "edit";
}
