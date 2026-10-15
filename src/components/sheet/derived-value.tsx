"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import { Button, TextField } from "@/components/form";
import { overrideValueSchema } from "@/engine/sheet/document";
import type { DerivedValue as Derived } from "@/engine/stats/derive";
import type { DerivedKey } from "@/engine/stats/keys";

import { derivedLabel } from "./labels";
import { formatSigned, parseInteger } from "./parse";

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
  const open = openKey === valueKey;
  const format = signed ? formatSigned : String;
  const label = derivedLabel(valueKey);
  const panelId = `override-${valueKey}`;

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
        className={`rounded px-1 font-semibold tabular-nums hover:bg-zinc-100 data-overridden:bg-amber-100 data-overridden:text-amber-900 dark:hover:bg-zinc-800 dark:data-overridden:bg-amber-950 dark:data-overridden:text-amber-200 ${className}`}
      >
        {format(derived.value)}
        {derived.overridden && (
          <span className="ml-1 align-middle text-[0.6rem] font-medium tracking-wide uppercase">
            manual
          </span>
        )}
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
      className={`fixed inset-x-4 bottom-4 z-20 flex flex-col gap-3 rounded-lg border border-zinc-300 bg-white p-4 text-left text-sm font-normal shadow-lg sm:absolute sm:inset-x-auto sm:top-full sm:bottom-auto sm:mt-1 sm:w-64 dark:border-zinc-700 dark:bg-zinc-950 ${align === "right" ? "sm:right-0" : "sm:left-0"}`}
    >
      <p className="font-medium">{label}</p>
      <p className="text-zinc-600 dark:text-zinc-400">
        Calculado: {format(derived.calculated)}
      </p>
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
