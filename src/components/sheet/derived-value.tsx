"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import { Button, TextField } from "@/components/form";
import { overrideValueSchema } from "@/engine/sheet/document";
import type { DerivedValue as Derived } from "@/engine/stats/derive";
import type { DerivedKey } from "@/engine/stats/keys";

import { derivedLabel } from "./labels";
import { formatSigned, parseInteger } from "./parse";
import { useSheetMode } from "./sheet-mode";

type OverrideControl = {
  openKey: DerivedKey | null;
  setOpenKey: (key: DerivedKey | null) => void;
  /** `undefined` remove o valor manual. */
  setOverride: (key: DerivedKey, value: number | undefined) => void;
};

const OverrideContext = createContext<OverrideControl | null>(null);

/** Um painel de override aberto por vez na ficha (design S7). */
export function OverrideProvider({
  setOverride,
  children,
}: {
  setOverride: OverrideControl["setOverride"];
  children: ReactNode;
}) {
  const [openKey, setOpenKey] = useState<DerivedKey | null>(null);
  return (
    <OverrideContext value={{ openKey, setOpenKey, setOverride }}>
      {children}
    </OverrideContext>
  );
}

function useOverrideControl() {
  const control = useContext(OverrideContext);
  if (!control) throw new Error("DerivedValue fora de OverrideProvider");
  return control;
}

/**
 * Valor calculado da ficha, que vira valor manual pelo painel (design S7).
 * `align` escolhe para que lado o painel abre no desktop.
 */
export function DerivedValue({
  valueKey,
  derived,
  signed = false,
  align = "left",
  className = "",
}: {
  valueKey: DerivedKey;
  derived: Derived;
  signed?: boolean;
  align?: "left" | "right";
  className?: string;
}) {
  const { openKey, setOpenKey, setOverride } = useOverrideControl();
  const mode = useSheetMode();
  const open = openKey === valueKey;
  const format = signed ? formatSigned : String;
  const label = derivedLabel(valueKey);
  const panelId = `override-${valueKey}`;
  const style = `rounded px-1 font-semibold tabular-nums data-overridden:bg-manual-soft data-overridden:text-manual ${className}`;
  const manualTag = derived.overridden && (
    <span className="ml-1 align-middle text-[0.6rem] font-medium tracking-wide uppercase">
      manual
    </span>
  );

  // Em Jogar, só leitura: sem botão nem painel (design V4).
  if (mode === "play") {
    return (
      <span
        data-overridden={derived.overridden || undefined}
        title={
          derived.overridden
            ? `Valor manual; calculado ${format(derived.calculated)}`
            : undefined
        }
        className={style}
      >
        {format(derived.value)}
        {manualTag}
      </span>
    );
  }

  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={
          derived.overridden
            ? `${label}: ${format(derived.value)}, valor manual; calculado ${format(derived.calculated)}. Alterar`
            : `${label}: ${format(derived.value)}. Alterar`
        }
        data-overridden={derived.overridden || undefined}
        onClick={() => setOpenKey(open ? null : valueKey)}
        className={`underline decoration-line decoration-dotted underline-offset-4 hover:bg-surface-2 ${style}`}
      >
        {format(derived.value)}
        {manualTag}
      </button>
      {open && (
        <OverridePanel
          id={panelId}
          label={label}
          derived={derived}
          format={format}
          align={align}
          onApply={(value) => {
            setOverride(valueKey, value);
            setOpenKey(null);
          }}
          onClear={() => {
            setOverride(valueKey, undefined);
            setOpenKey(null);
          }}
          onClose={() => setOpenKey(null)}
        />
      )}
    </span>
  );
}

function OverridePanel({
  id,
  label,
  derived,
  format,
  align,
  onApply,
  onClear,
  onClose,
}: {
  id: string;
  label: string;
  derived: Derived;
  format: (value: number) => string;
  align: "left" | "right";
  onApply: (value: number) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [raw, setRaw] = useState(
    derived.overridden ? String(derived.value) : "",
  );
  const [error, setError] = useState<string>();

  // No celular o painel fica preso ao pé da tela; a partir de `sm`, logo
  // abaixo do valor.
  return (
    <div
      id={id}
      role="group"
      aria-label={`Valor manual: ${label}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
      className={`fixed inset-x-4 bottom-4 z-20 flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 text-left text-sm font-normal text-text shadow-xl shadow-black/30 sm:absolute sm:inset-x-auto sm:top-full sm:bottom-auto sm:mt-1 sm:w-64 ${align === "right" ? "sm:right-0" : "sm:left-0"}`}
    >
      <p className="font-medium">{label}</p>
      <p className="text-muted">Calculado: {format(derived.calculated)}</p>
      {/* Não é <form>: o painel pode estar dentro de outro formulário. */}
      <TextField
        label="Valor manual"
        name={`${id}-value`}
        autoFocus
        autoComplete="off"
        value={raw}
        error={error}
        onChange={(event) => {
          setRaw(event.target.value);
          setError(undefined);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            apply();
          }
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={apply}>
          Aplicar
        </Button>
        {derived.overridden && (
          <Button type="button" variant="secondary" onClick={onClear}>
            Usar calculado
          </Button>
        )}
        <Button type="button" variant="secondary" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </div>
  );

  function apply() {
    const parsed = parseInteger(raw, overrideValueSchema);
    if (parsed.ok) onApply(parsed.value);
    else setError(parsed.error);
  }
}
