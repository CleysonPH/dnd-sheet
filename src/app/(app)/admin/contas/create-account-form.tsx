"use client";

import { useActionState } from "react";

import { Button, TextField } from "@/components/form";

import { createAccountAction, type CreateAccountState } from "./actions";
import { TempPasswordBox } from "./temp-password-box";

export function CreateAccountForm() {
  const [state, formAction, pending] = useActionState<
    CreateAccountState,
    FormData
  >(createAccountAction, {});

  return (
    <div className="flex flex-col gap-4">
      <form
        action={formAction}
        className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-start"
      >
        <TextField
          label="Nome"
          name="name"
          required
          maxLength={100}
          error={state.fieldErrors?.name}
        />
        <TextField
          label="E-mail"
          name="email"
          type="email"
          required
          error={state.fieldErrors?.email}
        />
        <Button type="submit" disabled={pending} className="sm:mt-6">
          {pending ? "Criando..." : "Criar conta"}
        </Button>
      </form>
      {state.created && (
        <TempPasswordBox
          label={`Conta de ${state.created.name} (${state.created.email}) criada. Senha provisória:`}
          password={state.created.tempPassword}
        />
      )}
    </div>
  );
}
