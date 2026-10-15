"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button, FormMessage, TextField } from "@/components/form";
import { authClient } from "@/lib/auth-client";
import { RESET_MESSAGES, resetPasswordErrorMessage } from "@/lib/auth-messages";
import { passwordSchema } from "@/lib/password";

function InvalidLink() {
  return (
    <div className="flex flex-col gap-4">
      <FormMessage>{RESET_MESSAGES.invalidLink}</FormMessage>
      <Link
        href="/esqueci-senha"
        className="text-center text-sm font-medium text-accent hover:underline"
      >
        Pedir um novo link
      </Link>
    </div>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [pending, setPending] = useState(false);

  if (!token || invalid) return <InvalidLink />;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const newPassword = String(
      new FormData(event.currentTarget).get("password"),
    );
    setError(null);

    const parsed = passwordSchema.safeParse(newPassword);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message);
      return;
    }
    setFieldError(undefined);
    setPending(true);

    // Encerra todas as sessões e conclui a troca pendente (design P5).
    const { error } = await authClient.resetPassword({
      newPassword: parsed.data,
      token: token!,
    });

    if (error) {
      if (error.code === "INVALID_TOKEN") setInvalid(true);
      else setError(resetPasswordErrorMessage(error));
      setPending(false);
      return;
    }
    router.replace("/login?redefinida=1");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error && <FormMessage>{error}</FormMessage>}
      <TextField
        label="Nova senha"
        name="password"
        type="password"
        autoComplete="new-password"
        error={fieldError}
        required
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Redefinir senha"}
      </Button>
    </form>
  );
}
