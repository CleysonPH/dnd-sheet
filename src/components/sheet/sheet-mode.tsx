"use client";

import { createContext, useContext } from "react";

import type { SheetMode } from "./mode";

const SheetModeContext = createContext<SheetMode>("edit");

export const SheetModeProvider = SheetModeContext;

/** Modo atual da ficha (design V4). */
export function useSheetMode(): SheetMode {
  return useContext(SheetModeContext);
}

const OPTIONS: { mode: SheetMode; label: string }[] = [
  { mode: "play", label: "Jogar" },
  { mode: "edit", label: "Editar" },
];

/** Chave segmentada Jogar | Editar. Trocar de modo não altera a ficha. */
export function ModeSwitch({
  mode,
  onChange,
}: {
  mode: SheetMode;
  onChange: (mode: SheetMode) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Modo da ficha"
      className="inline-flex rounded-lg border border-line bg-surface p-0.5"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.mode}
          type="button"
          aria-pressed={mode === option.mode}
          onClick={() => onChange(option.mode)}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-text aria-pressed:bg-accent aria-pressed:text-on-accent"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
