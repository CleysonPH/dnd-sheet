"use client";

import { useState } from "react";

import { Card, TextField } from "@/components/form";
import { identitySchema, type SheetIdentity } from "@/engine/sheet/document";

import { NumberField } from "./number-field";
import { parseInteger } from "./parse";
import type { SheetPartProps } from "./props";

type TextFieldName = Exclude<keyof SheetIdentity, "level">;

const TEXT_FIELDS: { field: TextFieldName; label: string }[] = [
  { field: "name", label: "Nome do personagem" },
  { field: "species", label: "Espécie" },
  { field: "class", label: "Classe" },
  { field: "background", label: "Antecedente" },
];

/** Cabeçalho de identificação, editável só no modo Editar (spec character-sheets). */
export function IdentitySection({ document, update }: SheetPartProps) {
  const { identity } = document;
  const [raw, setRaw] = useState(() => ({
    name: identity.name,
    species: identity.species,
    class: identity.class,
    background: identity.background,
  }));
  const [errors, setErrors] = useState<Partial<Record<TextFieldName, string>>>(
    {},
  );

  function setIdentity(patch: Partial<SheetIdentity>) {
    update({ identity: { ...identity, ...patch } });
  }

  function onTextChange(field: TextFieldName, value: string) {
    setRaw((current) => ({ ...current, [field]: value }));
    // Valida com o mesmo schema do servidor (design C2/C5).
    const parsed = identitySchema.shape[field].safeParse(value);
    if (!parsed.success) {
      // Valor inválido fica só na tela; o documento salvo não muda.
      setErrors((current) => ({
        ...current,
        [field]: parsed.error.issues[0]?.message,
      }));
      return;
    }
    setErrors((current) => ({ ...current, [field]: undefined }));
    setIdentity({ [field]: parsed.data });
  }

  return (
    <Card title="Personagem">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {TEXT_FIELDS.map(({ field, label }) => (
          <TextField
            key={field}
            label={label}
            name={field}
            value={raw[field]}
            maxLength={100}
            onChange={(event) => onTextChange(field, event.target.value)}
            error={errors[field]}
          />
        ))}
        <NumberField
          label="Nível"
          name="level"
          inputMode="numeric"
          value={identity.level}
          parse={(text) => parseInteger(text, identitySchema.shape.level)}
          onCommit={(level) => setIdentity({ level })}
        />
      </div>
    </Card>
  );
}
