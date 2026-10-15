"use client";

import { useMemo } from "react";

import type { SheetDocument } from "@/engine/sheet/document";
import { deriveStats } from "@/engine/stats/derive";

import { OverrideProvider } from "./derived-value";
import { SheetBody } from "./sheet-body";
import { subtitle } from "./sheet-editor";
import { SheetModeProvider } from "./sheet-mode";

const ignore = () => {};

/**
 * Ficha compartilhada, só para leitura (design L4): o mesmo corpo do editor no
 * modo "view", sem autosave e com um update que não faz nada.
 */
export function SheetViewer({ document }: { document: SheetDocument }) {
  const stats = useMemo(() => deriveStats(document), [document]);
  return (
    <SheetModeProvider value="view">
      <OverrideProvider setOverride={ignore}>
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="truncate text-3xl font-semibold">
              {document.identity.name}
            </h1>
            <p className="text-sm text-muted">{subtitle(document)}</p>
          </div>
          <SheetBody document={document} stats={stats} update={ignore} />
        </div>
      </OverrideProvider>
    </SheetModeProvider>
  );
}
