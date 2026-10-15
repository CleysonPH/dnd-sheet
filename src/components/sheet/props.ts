import type { SheetDocument } from "@/engine/sheet/document";
import type { DerivedStats } from "@/engine/stats/derive";

/** Alteração no documento: campos a substituir ou uma função do documento. */
export type SheetChange =
  Partial<SheetDocument> | ((document: SheetDocument) => SheetDocument);

/** O que cada parte da ficha recebe do editor. */
export type SheetPartProps = {
  document: SheetDocument;
  stats: DerivedStats;
  /** Grava uma alteração no documento (passa pelo autosave). */
  update: (change: SheetChange) => void;
};
