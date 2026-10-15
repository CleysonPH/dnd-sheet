import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard } from "@/components/form";

import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Redefinir senha · Ficha D&D" };

// Pública, aberta pelo link do e-mail (spec authentication, design P6).
export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Redefinir senha"
      description="Escolha uma nova senha para a sua conta."
    >
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
