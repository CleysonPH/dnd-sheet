"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import { Button, TextField } from "@/components/form";
import { overrideValueSchema } from "@/engine/sheet/document";
import type {
  Contribution,
  DerivedValue as Derived,
} from "@/engine/stats/derive";
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

/** Parcelas de um valor (design E5): base, efeitos e os não usados. */
export function Contributions({
  parts,
  format,
}: {
  parts: Contribution[];
  format: (value: number) => string;
}) {
  if (parts.length === 0) return null;
  return (
    <ul className="flex flex-col gap-0.5 rounded-md bg-surface-2 p-2 text-xs">
      {parts.map((part, index) => (
        <li
          key={index}
          data-kind={part.kind}
          className="flex justify-between gap-3 data-[kind=unused]:text-muted data-[kind=unused]:line-through"
        >
          <span className="min-w-0 truncate">
            {part.label}
            {part.kind === "unused" && (
              <span className="sr-only"> (não usado)</span>
            )}
          </span>
          <span className="shrink-0 tabular-nums">
            {part.kind === "add" || part.kind === "proficiency"
              ? formatSigned(part.amount)
              : part.kind === "set"
                ? `= ${format(part.amount)}`
                : format(part.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Caixa dos painéis: no celular presa ao pé da tela; a partir de `sm`, abaixo do valor. */
export function PanelShell({
  id,
  ariaLabel,
  align,
  onClose,
  children,
}: {
  id: string;
  ariaLabel: string;
  align: "left" | "right";
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      id={id}
      role="group"
      aria-label={ariaLabel}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
      className={`fixed inset-x-4 bottom-4 z-20 flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 text-left text-sm font-normal text-text shadow-xl shadow-black/30 sm:absolute sm:inset-x-auto sm:top-full sm:bottom-auto sm:mt-1 sm:w-72 ${align === "right" ? "sm:right-0" : "sm:left-0"}`}
    >
      {children}
    </div>
  );
}

/**
 * Valor calculado da ficha (design S7/E6). Em Editar, o painel mostra a origem
 * e o valor manual; em Jogar, só a origem. `align` escolhe para que lado o
 * painel abre no desktop.
 */
export function DerivedValue({
  valueKey,
  derived,
  signed = false,
  format: customFormat,
  align = "left",
  className = "",
}: {
  valueKey: DerivedKey;
  derived: Derived;
  signed?: boolean;
  format?: (value: number) => string;
  align?: "left" | "right";
  className?: string;
}) {
  const { openKey, setOpenKey, setOverride } = useOverrideControl();
  const mode = useSheetMode();
  const open = openKey === valueKey;
  const format = customFormat ?? (signed ? formatSigned : String);
  const label = derivedLabel(valueKey);
  const panelId = `override-${valueKey}`;
  const close = () => setOpenKey(null);
  const summary = derived.overridden
    ? `${label}: ${format(derived.value)}, valor manual; calculado ${format(derived.calculated)}`
    : `${label}: ${format(derived.value)}`;

  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`${summary}. ${mode === "edit" ? "Alterar" : "Ver origem"}`}
        data-overridden={derived.overridden || undefined}
        onClick={() => setOpenKey(open ? null : valueKey)}
        className={`rounded px-1 font-semibold tabular-nums hover:bg-surface-2 data-overridden:bg-manual-soft data-overridden:text-manual ${mode === "edit" ? "underline decoration-line decoration-dotted underline-offset-4" : ""} ${className}`}
      >
        {format(derived.value)}
        {derived.overridden && (
          <span className="ml-1 align-middle text-[0.6rem] font-medium tracking-wide uppercase">
            manual
          </span>
        )}
      </button>
      {open &&
        (mode === "edit" ? (
          <OverridePanel
            id={panelId}
            label={label}
            derived={derived}
            format={format}
            align={align}
            onApply={(value) => {
              setOverride(valueKey, value);
              close();
            }}
            onClear={() => {
              setOverride(valueKey, undefined);
              close();
            }}
            onClose={close}
          />
        ) : (
          <PanelShell
            id={panelId}
            ariaLabel={`Origem: ${label}`}
            align={align}
            onClose={close}
          >
            <p className="font-medium">
              {label}: {format(derived.value)}
            </p>
            {derived.overridden && (
              <p className="text-muted">
                Valor manual; calculado {format(derived.calculated)}
              </p>
            )}
            <Contributions parts={derived.parts} format={format} />
            <Button type="button" variant="secondary" autoFocus onClick={close}>
              Fechar
            </Button>
          </PanelShell>
        ))}
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

  return (
    <PanelShell
      id={id}
      ariaLabel={`Valor manual: ${label}`}
      align={align}
      onClose={onClose}
    >
      <p className="font-medium">{label}</p>
      <p className="text-muted">Calculado: {format(derived.calculated)}</p>
      <Contributions parts={derived.parts} format={format} />
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
    </PanelShell>
  );

  function apply() {
    const parsed = parseInteger(raw, overrideValueSchema);
    if (parsed.ok) onApply(parsed.value);
    else setError(parsed.error);
  }
}
