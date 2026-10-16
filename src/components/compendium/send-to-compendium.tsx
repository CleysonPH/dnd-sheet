"use client";

import { useState } from "react";

import { sendToCompendiumAction } from "@/app/(app)/compendium-actions";
import { Button } from "@/components/form";
import type { Source } from "@/engine/sources/schema";

const ERROR_TEXT = {
  invalid: "A fonte tem campos inválidos.",
  limit: "O compêndio chegou ao limite de entradas.",
} as const;

/** "Enviar ao compêndio": cria uma entrada nova com a fonte (spec, B7). */
export function SendToCompendium({ source }: { source: Source }) {
  const [state, setState] = useState<
    { kind: "idle" | "sending" | "sent" } | { kind: "error"; text: string }
  >({ kind: "idle" });

  async function send() {
    setState({ kind: "sending" });
    const result = await sendToCompendiumAction(source);
    setState(
      result.ok
        ? { kind: "sent" }
        : { kind: "error", text: ERROR_TEXT[result.error] },
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        disabled={state.kind === "sending"}
        onClick={() => void send()}
      >
        Enviar ao compêndio
      </Button>
      {state.kind === "sent" && (
        <span role="status" className="text-xs text-success">
          Enviada ao compêndio
        </span>
      )}
      {state.kind === "error" && (
        <span role="status" className="text-xs text-danger">
          {state.text}
        </span>
      )}
    </span>
  );
}
