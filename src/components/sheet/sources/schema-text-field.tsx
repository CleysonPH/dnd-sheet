"use client";

import { useState, type ComponentProps } from "react";
import type { z } from "zod";

import { TextField } from "@/components/form";

/**
 * Campo de texto que guarda o que foi digitado e só grava valores que o
 * schema aceita, mostrando o erro no campo (como o cabeçalho da ficha).
 * `multiline` usa um <textarea>.
 */
export function SchemaTextField({
  label,
  name,
  value,
  schema,
  onCommit,
  multiline = false,
  hint,
  ...input
}: Omit<ComponentProps<"input">, "value" | "onChange"> & {
  label: string;
  name: string;
  value: string;
  schema: z.ZodType<string>;
  onCommit: (value: string) => void;
  multiline?: boolean;
  hint?: string;
}) {
  const [raw, setRaw] = useState(value);
  const [error, setError] = useState<string>();

  function onChange(text: string) {
    setRaw(text);
    const parsed = schema.safeParse(text);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    if (parsed.data !== value) onCommit(parsed.data);
  }

  if (!multiline) {
    return (
      <TextField
        {...input}
        label={label}
        name={name}
        value={raw}
        error={error}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={6}
        value={raw}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [hint && `${name}-hint`, error && `${name}-error`]
            .filter(Boolean)
            .join(" ") || undefined
        }
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-w-0 rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent aria-invalid:border-danger"
      />
      {hint && (
        <p id={`${name}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
