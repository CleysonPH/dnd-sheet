"use client";

import { useActionState } from "react";

import {
  changePasswordAction,
  type PasswordFormState,
} from "@/app/password-actions";

import { Button, FormMessage, TextField } from "./form";

export function ChangePasswordForm({
  mode,
}: {
  mode: "required" | "voluntary";
}) {
  const [state, formAction, pending] = useActionState<
    PasswordFormState,
    FormData
  >(changePasswordAction.bind(null, mode), {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.success && (
        <FormMessage kind="success">{state.success}</FormMessage>
      )}
      <TextField
        label={mode === "required" ? "Senha provisória" : "Senha atual"}
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.currentPassword}
      />
      <TextField
        label="Nova senha"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        minLength={8}
        maxLength={128}
        required
        error={state.fieldErrors?.newPassword}
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Trocar senha"}
      </Button>
    </form>
  );
}
