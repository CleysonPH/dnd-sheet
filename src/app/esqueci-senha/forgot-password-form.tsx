"use client";

import { useState, type FormEvent } from "react";

import { Button, FormMessage, TextField } from "@/components/form";
import { authClient } from "@/lib/auth-client";
import { RESET_MESSAGES, requestResetErrorMessage } from "@/lib/auth-messages";

type Status =
  { kind: "idle" } | { kind: "sent" } | { kind: "error"; message: string };

export function ForgotPasswordForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);

    // Pelo endpoint HTTP do Better Auth, que aplica o limite de pedidos
    // (design P6). A resposta é a mesma exista a conta ou não.
    const { error } = await authClient.requestPasswordReset({
      email: String(data.get("email")).trim().toLowerCase(),
    });

    setStatus(
      error
        ? { kind: "error", message: requestResetErrorMessage(error) }
        : { kind: "sent" },
    );
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {status.kind === "sent" && (
        <FormMessage kind="success">{RESET_MESSAGES.requested}</FormMessage>
      )}
      {status.kind === "error" && <FormMessage>{status.message}</FormMessage>}
      <TextField
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Enviando..." : "Enviar link"}
      </Button>
    </form>
  );
}
