"use client";

import { useActionState, useState } from "react";

import {
  deleteSheetAction,
  type DeleteSheetState,
} from "@/app/(app)/fichas/[id]/actions";
import { Button, FormMessage, TextField } from "@/components/form";

/** Exclusão definitiva, confirmada digitando o nome do personagem (design C6). */
export function DeleteSheetPanel({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [state, formAction, pending] = useActionState<
    DeleteSheetState,
    FormData
  >(deleteSheetAction.bind(null, id), {});

  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Excluir ficha
      </Button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-red-300 p-4 dark:border-red-900"
    >
      <p className="text-sm">
        A exclusão é definitiva. Para confirmar, digite o nome do personagem:{" "}
        <strong>{name}</strong>
      </p>
      {state.error && <FormMessage>{state.error}</FormMessage>}
      <TextField
        label="Nome do personagem"
        name="confirmName"
        value={typed}
        onChange={(event) => setTyped(event.target.value)}
        autoComplete="off"
      />
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={pending || typed !== name}
          className="bg-red-700 text-white hover:bg-red-600 dark:bg-red-700 dark:text-white dark:hover:bg-red-600"
        >
          {pending ? "Excluindo..." : "Excluir definitivamente"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setOpen(false);
            setTyped("");
          }}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
