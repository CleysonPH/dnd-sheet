"use client";

import { useActionState, useState } from "react";

import { updateEmailAction, type EmailActionState } from "./actions";

const SMALL_BUTTON =
  "rounded-md border border-line px-2 py-1 text-xs hover:bg-surface-2 disabled:opacity-50";

/** "Alterar e-mail" com formulário em linha (design P7). */
export function EditEmail({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<
    EmailActionState,
    FormData
  >(async (previous, formData) => {
    const result = await updateEmailAction(userId, previous, formData);
    if (result.saved) setOpen(false);
    return result;
  }, {});

  if (!open) {
    return (
      <button
        type="button"
        className={SMALL_BUTTON}
        onClick={() => setOpen(true)}
      >
        Alterar e-mail
      </button>
    );
  }

  const inputId = `email-${userId}`;
  return (
    <form action={formAction} className="flex w-full min-w-56 flex-col gap-2">
      <input
        id={inputId}
        name="email"
        type="email"
        aria-label="Novo e-mail"
        defaultValue={email}
        required
        autoFocus
        aria-invalid={state.error ? true : undefined}
        aria-describedby={state.error ? `${inputId}-error` : undefined}
        className="w-full min-w-0 rounded-md border border-line bg-bg px-2 py-1 text-xs outline-none focus:border-accent aria-invalid:border-danger"
      />
      {state.error && (
        <p id={`${inputId}-error`} className="text-xs text-danger">
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-on-accent hover:bg-accent-hover disabled:opacity-50"
        >
          Salvar
        </button>
        <button
          type="button"
          className={SMALL_BUTTON}
          onClick={() => setOpen(false)}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
