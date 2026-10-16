import { Badge } from "@/components/form";
import type { Source } from "@/engine/sources/schema";

import { describeEffect } from "../sheet/sources/effect-labels";
import { sourceSummary, spellLevelLabel } from "../sheet/sources/labels";

export const KIND_LABEL: Record<Source["kind"], string> = {
  feat: "Talento",
  trait: "Traço",
  item: "Item",
  spell: "Magia",
};

/** Nome, tipo, dados principais e resumo dos efeitos de uma entrada (B7). */
export function EntrySummary({
  source,
  badge,
}: {
  source: Source;
  badge?: string;
}) {
  const details = [
    source.kind === "spell" ? spellLevelLabel(source.level) : null,
    sourceSummary(source),
  ]
    .filter(Boolean)
    .join(" · ");
  const effects = source.effects.map(describeEffect).join("; ");
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{source.name}</span>
        <Badge>{KIND_LABEL[source.kind]}</Badge>
        {badge && <Badge tone="accent">{badge}</Badge>}
      </div>
      {details && <p className="text-xs text-muted">{details}</p>}
      {effects && <p className="text-xs text-muted">{effects}</p>}
    </div>
  );
}
