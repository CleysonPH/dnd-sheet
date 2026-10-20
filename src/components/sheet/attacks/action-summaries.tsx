import {
  actionContext,
  deriveSourceActions,
  type ActionContext,
  type ActionLine,
} from "@/engine/attacks/derive";
import { createSheetDocument } from "@/engine/sheet/document";
import type { Source } from "@/engine/sources/schema";
import { deriveStats } from "@/engine/stats/derive";

import { describeLine } from "./labels";

/** "Uma mão: +6 · 1d8+3 cortante", uma linha por ação (design G8). */
export function ActionSummaries({
  lines,
  label,
  className = "",
}: {
  lines: readonly ActionLine[];
  label: string;
  className?: string;
}) {
  if (lines.length === 0) return null;
  return (
    <ul aria-label={label} className={`flex flex-col gap-0.5 ${className}`}>
      {lines.map((line) => (
        <li key={line.actionId} className="text-xs">
          {line.name && <span className="font-medium">{line.name}: </span>}
          {describeLine(line)}
          {line.description && (
            <span className="block text-muted">{line.description}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

let newSheetContext: ActionContext | null = null;

/** Contexto de uma ficha nova, para o compêndio (como a pré-visualização, B6). */
function exampleContext(): ActionContext {
  if (!newSheetContext) {
    const document = createSheetDocument("Exemplo");
    newSheetContext = actionContext(document, deriveStats(document));
  }
  return newSheetContext;
}

/** Ações de uma entrada do compêndio, com os valores de uma ficha nova. */
export function exampleActionLines(source: Source): ActionLine[] {
  return deriveSourceActions(source, exampleContext());
}
