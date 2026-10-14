"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, FormMessage, TextField } from "@/components/form";
import {
  identitySchema,
  type SheetDocument,
  type SheetIdentity,
} from "@/engine/sheet/document";

import type { AutosaveStatus } from "./autosave";
import { DeleteSheetPanel } from "./delete-sheet-panel";
import { useSheetAutosave, type SaveOutcome } from "./use-sheet-autosave";

type Field = keyof SheetIdentity;

const FIELDS: { field: Field; label: string }[] = [
  { field: "name", label: "Nome do personagem" },
  { field: "species", label: "Espécie" },
  { field: "class", label: "Classe" },
  { field: "level", label: "Nível" },
  { field: "background", label: "Antecedente" },
];

const STATUS_TEXT: Record<AutosaveStatus, string> = {
  saved: "Salvo",
  pending: "Salvando…",
  saving: "Salvando…",
  error: "Não salvo. Tentando de novo…",
  invalid: "Não salvo: dados inválidos",
  conflict: "Não salvo",
  deleted: "Não salvo",
};

function toRaw(identity: SheetIdentity): Record<Field, string> {
  return {
    name: identity.name,
    species: identity.species,
    class: identity.class,
    level: String(identity.level),
    background: identity.background,
  };
}

/** Valida um campo com o mesmo schema do servidor (design C2/C5). */
function parseField(field: Field, raw: string) {
  const value =
    field === "level" ? (raw.trim() === "" ? NaN : Number(raw)) : raw;
  return identitySchema.shape[field].safeParse(value);
}

export function SheetEditor({
  id,
  initialDocument,
  initialVersion,
  save,
}: {
  id: string;
  initialDocument: SheetDocument;
  initialVersion: number;
  save: (baseVersion: number, document: SheetDocument) => Promise<SaveOutcome>;
}) {
  const router = useRouter();
  const { document, status, locked, edit } = useSheetAutosave({
    initialDocument,
    initialVersion,
    save,
  });
  const [raw, setRaw] = useState(() => toRaw(initialDocument.identity));
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  function onChange(field: Field, value: string) {
    setRaw((current) => ({ ...current, [field]: value }));
    const parsed = parseField(field, value);
    if (!parsed.success) {
      // Valor inválido fica só na tela; o documento salvo não muda.
      setErrors((current) => ({
        ...current,
        [field]: parsed.error.issues[0]?.message,
      }));
      return;
    }
    setErrors((current) => ({ ...current, [field]: undefined }));
    edit({
      ...document,
      identity: { ...document.identity, [field]: parsed.data },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{document.identity.name}</h1>
        <p
          role="status"
          aria-live="polite"
          className="text-sm text-zinc-500"
          data-status={status}
        >
          {STATUS_TEXT[status]}
        </p>
      </div>

      {status === "conflict" && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <FormMessage>
            Esta ficha foi alterada em outro lugar. Recarregue para ver a versão
            mais nova; o que você editou desde o último salvamento aqui não foi
            gravado.
          </FormMessage>
          <Button type="button" onClick={() => router.refresh()}>
            Recarregar
          </Button>
        </div>
      )}
      {status === "deleted" && (
        <FormMessage>
          Esta ficha não existe mais: ela foi excluída em outro lugar.
        </FormMessage>
      )}

      <fieldset
        disabled={locked}
        className="grid gap-4 disabled:opacity-60 sm:grid-cols-2"
      >
        {FIELDS.map(({ field, label }) => (
          <TextField
            key={field}
            label={label}
            name={field}
            value={raw[field]}
            onChange={(event) => onChange(field, event.target.value)}
            error={errors[field]}
            {...(field === "level"
              ? {
                  type: "number",
                  min: 1,
                  max: 20,
                  step: 1,
                  inputMode: "numeric",
                }
              : { maxLength: 100 })}
          />
        ))}
      </fieldset>

      {/* Em conflito ou já excluída, excluir daqui não faz sentido. */}
      {!locked && (
        <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          {/* Usa o nome atual, já que a pessoa pode ter renomeado o personagem. */}
          <DeleteSheetPanel id={id} name={document.identity.name} />
        </div>
      )}
    </div>
  );
}
