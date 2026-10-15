"use client";

import { useState, type ComponentProps } from "react";

import { TextField } from "@/components/form";

import type { ParseResult } from "./parse";

type Props = Omit<
  ComponentProps<"input">,
  "value" | "onChange" | "onFocus" | "onBlur" | "type"
> & {
  label: string;
  value: number;
  parse: (raw: string) => ParseResult;
  onCommit: (value: number) => void;
  format?: (value: number) => string;
};

/**
 * Campo numérico com rascunho (design S6). Em foco, guarda o texto digitado e
 * só repassa valores válidos; o erro aparece no campo. Fora de foco, mostra o
 * valor do documento, que pode mudar por outros campos.
 */
export function NumberField({
  value,
  parse,
  onCommit,
  format = String,
  ...input
}: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  function onChange(raw: string) {
    setDraft(raw);
    const parsed = parse(raw);
    if (!parsed.ok) {
      // Valor inválido fica só na tela; o documento não muda.
      setError(parsed.error);
      return;
    }
    setError(undefined);
    if (parsed.value !== value) onCommit(parsed.value);
  }

  return (
    <TextField
      {...input}
      type="text"
      autoComplete="off"
      value={draft ?? format(value)}
      error={error}
      onFocus={() => setDraft(format(value))}
      onChange={(event) => onChange(event.target.value)}
      onBlur={() => {
        setDraft(null);
        setError(undefined);
      }}
    />
  );
}
