"use client";

import { useState } from "react";

import { TextField } from "@/components/form";
import {
  EvaluationError,
  evaluate,
  parseExpression,
  type ExpressionScope,
  type ExpressionVariables,
} from "@/engine/effects/expression";

const MAX_LENGTH = 100;

/** Resultado da expressão com as variáveis atuais, ou o erro. */
function preview(
  text: string,
  variables: ExpressionVariables,
  scope: ExpressionScope,
) {
  const parsed = parseExpression(text, scope);
  if (!parsed.ok) return { ok: false as const, message: parsed.error };
  try {
    return { ok: true as const, value: evaluate(parsed.expression, variables) };
  } catch (error) {
    if (error instanceof EvaluationError) {
      return { ok: false as const, message: error.message };
    }
    throw error;
  }
}

/**
 * Campo de expressão (efeitos e máximo de trackers): guarda o texto digitado,
 * mostra "= 15" ou o erro e só grava expressões válidas (design E7/R4).
 */
export function ExpressionField({
  label,
  name,
  value,
  placeholder,
  variables,
  scope = "sheet",
  onCommit,
}: {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  variables: ExpressionVariables;
  /** Escopo das variáveis aceitas (design H2). */
  scope?: ExpressionScope;
  onCommit: (expression: string) => void;
}) {
  const [raw, setRaw] = useState(value);
  const result = preview(raw, variables, scope);
  const tooLong = raw.length > MAX_LENGTH;
  const error = tooLong
    ? `Use no máximo ${MAX_LENGTH} caracteres`
    : result.ok
      ? undefined
      : `Expressão inválida: ${result.message}`;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <TextField
        label={label}
        name={name}
        value={raw}
        error={error}
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        onChange={(event) => {
          const text = event.target.value;
          setRaw(text);
          if (
            text.length <= MAX_LENGTH &&
            parseExpression(text, scope).ok &&
            text !== value
          ) {
            onCommit(text);
          }
        }}
      />
      {result.ok && (
        <p className="text-xs text-muted" aria-live="polite">
          = {result.value}
        </p>
      )}
    </div>
  );
}
