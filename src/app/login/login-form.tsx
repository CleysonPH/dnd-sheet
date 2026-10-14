"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button, FormMessage, TextField } from "@/components/form";
import { authClient } from "@/lib/auth-client";
import { loginErrorMessage } from "@/lib/auth-messages";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    // Login pelo endpoint HTTP do Better Auth, que aplica o rate limit (design A3).
    const { error } = await authClient.signIn.email({
      email: String(data.get("email")),
      password: String(data.get("password")),
    });

    if (error) {
      setError(loginErrorMessage(error));
      setPending(false);
      return;
    }
    // O proxy decide o destino: página inicial ou troca de senha obrigatória.
    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error && <FormMessage>{error}</FormMessage>}
      <TextField
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <TextField
        label="Senha"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
