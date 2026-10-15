import { useId, type ReactNode } from "react";

import type { SheetDocument } from "@/engine/sheet/document";
import type { DerivedStats } from "@/engine/stats/derive";

/** O que cada seção da ficha recebe do editor (design S8). */
export type SectionProps = {
  document: SheetDocument;
  stats: DerivedStats;
  /** Grava uma alteração no documento (passa pelo autosave). */
  update: (patch: Partial<SheetDocument>) => void;
};

/** Cartão de uma seção, posicionado na grade da ficha por `area`. */
export function Section({
  title,
  area,
  children,
}: {
  title: string;
  area: "identity" | "combat" | "abilities" | "skills";
  children: ReactNode;
}) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      style={{ gridArea: area }}
      className="min-w-0 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <h2
        id={titleId}
        className="mb-3 text-sm font-semibold tracking-wide text-zinc-500 uppercase"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
