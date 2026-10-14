"use client";

import { useActionState } from "react";

import { Button, TextField } from "@/components/form";

import { createSheetAction, type CreateSheetState } from "./actions";

export function CreateSheetForm() {
  const [state, formAction, pending] = useActionState<
    CreateSheetState,
    FormData
  >(createSheetAction, {});

  return (
    <form
      action={formAction}
      className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start"
    >
      <TextField
        label="Nome do personagem"
        name="name"
        required
        maxLength={100}
        error={state.error}
      />
      <Button type="submit" disabled={pending} className="sm:mt-6">
        {pending ? "Criando..." : "Nova ficha"}
      </Button>
    </form>
  );
}
